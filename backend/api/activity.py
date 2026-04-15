import json
import os
import re
from datetime import date, datetime, timedelta, timezone

import requests
from flask import Blueprint, jsonify

from api.cache import get_ttl_cache, set_ttl_cache

activity_bp = Blueprint("activity", __name__)

ACTIVITY_CACHE_KEY = "portfolio:activity:v1"
ACTIVITY_CACHE_TTL_SECONDS = 6 * 60 * 60
DAYS_TO_RENDER = 365

GITHUB_CONTRIB_URL = "https://github.com/users/{username}/contributions"
LEETCODE_GRAPHQL_URL = "https://leetcode.com/graphql"
LEETCODE_FALLBACK_API = os.getenv("LEETCODE_FALLBACK_API", "https://leetcode-api-faisalshohag.vercel.app")
MONKEYTYPE_ACTIVITY_URL = "https://api.monkeytype.com/users/currentTestActivity"


def _count_to_level(count: int, max_count: int) -> int:
    """Map raw count to level 0-4 for activity heatmaps."""
    if count <= 0:
        return 0
    if max_count <= 1:
        return 4

    ratio = count / max_count
    if ratio <= 0.25:
        return 1
    if ratio <= 0.5:
        return 2
    if ratio <= 0.75:
        return 3
    return 4


def _normalize_counts(counts_by_date: dict[str, int], days: int = DAYS_TO_RENDER) -> list[dict]:
    """
    Convert date->count map into a fixed-size day-by-day array.
    Ensures every date has an entry and computes level based on max count.
    """
    today = date.today()
    start = today - timedelta(days=days - 1)

    points: list[dict] = []
    max_count = 0

    for i in range(days):
        day = start + timedelta(days=i)
        day_key = day.isoformat()
        count = int(counts_by_date.get(day_key, 0) or 0)
        if count < 0:
            count = 0
        max_count = max(max_count, count)
        points.append({"date": day_key, "count": count})

    for point in points:
        point["level"] = _count_to_level(point["count"], max_count)

    return points


def _from_unix_to_iso_date(value: int) -> str:
    """Convert unix timestamp in seconds/millis to YYYY-MM-DD."""
    ts = int(value)
    if ts > 10_000_000_000:
        ts = ts // 1000
    return datetime.fromtimestamp(ts, tz=timezone.utc).date().isoformat()


def _as_provider_payload(
    source: str,
    label: str,
    username: str,
    data: list[dict] | None = None,
    error: str | None = None,
    note: str | None = None,
) -> dict:
    points = data or []
    total_count = sum(int(p.get("count", 0) or 0) for p in points)
    max_count = max((int(p.get("count", 0) or 0) for p in points), default=0)

    payload = {
        "source": source,
        "label": label,
        "username": username,
        "available": len(points) > 0 and not error,
        "data": points,
        "totalCount": total_count,
        "maxCount": max_count,
    }

    if error:
        payload["error"] = error
    if note:
        payload["note"] = note

    return payload


def _fetch_github_activity() -> dict:
    username = os.getenv("GITHUB_USERNAME", "ancient-kid").strip()
    if not username:
        return _as_provider_payload(
            source="github",
            label="GitHub",
            username="",
            error="Set GITHUB_USERNAME in backend environment",
        )

    try:
        today = date.today()
        start = today - timedelta(days=DAYS_TO_RENDER - 1)
        url = f"{GITHUB_CONTRIB_URL.format(username=username)}?from={start.isoformat()}&to={today.isoformat()}"

        response = requests.get(
            url,
            headers={
                "User-Agent": "Mozilla/5.0",
                "Accept": "image/svg+xml,text/html;q=0.9,*/*;q=0.8",
            },
            timeout=20,
        )
        response.raise_for_status()

        markup = response.text
        tags = re.findall(r"<[^>]+data-date=[\"'][^\"']+[\"'][^>]*>", markup)

        counts: dict[str, int] = {}
        for tag in tags:
            date_match = re.search(r"data-date=[\"'](\d{4}-\d{2}-\d{2})[\"']", tag)
            count_match = re.search(r"data-count=[\"'](\d+)[\"']", tag)
            level_match = re.search(r"data-level=[\"'](\d+)[\"']", tag)

            if not date_match:
                continue

            if count_match:
                count_value = int(count_match.group(1))
            elif level_match:
                # GitHub now exposes activity intensity as data-level in public markup.
                count_value = int(level_match.group(1))
            else:
                continue

            counts[date_match.group(1)] = count_value

        if not counts:
            raise ValueError("GitHub contributions were empty")

        return _as_provider_payload(
            source="github",
            label="GitHub",
            username=username,
            data=_normalize_counts(counts),
        )
    except Exception as exc:
        return _as_provider_payload(
            source="github",
            label="GitHub",
            username=username,
            error=f"Failed to fetch GitHub activity: {exc}",
        )


def _extract_leetcode_calendar_from_graphql(username: str) -> dict[str, int]:
    query = """
    query userCalendar($username: String!, $year: Int) {
      matchedUser(username: $username) {
        userCalendar(year: $year) {
          submissionCalendar
        }
      }
    }
    """

    response = requests.post(
        LEETCODE_GRAPHQL_URL,
        json={"query": query, "variables": {"username": username}},
        headers={"User-Agent": "Mozilla/5.0", "Content-Type": "application/json"},
        timeout=20,
    )
    response.raise_for_status()

    payload = response.json()
    calendar_str = (
        payload.get("data", {})
        .get("matchedUser", {})
        .get("userCalendar", {})
        .get("submissionCalendar", "")
    )

    if not calendar_str:
        return {}

    raw = json.loads(calendar_str)
    counts: dict[str, int] = {}

    for ts, count in raw.items():
        try:
            date_key = _from_unix_to_iso_date(int(float(ts)))
            counts[date_key] = counts.get(date_key, 0) + int(count or 0)
        except (TypeError, ValueError):
            continue

    return counts


def _extract_leetcode_calendar_from_fallback(username: str) -> dict[str, int]:
    url = f"{LEETCODE_FALLBACK_API.rstrip('/')}/{username}"
    response = requests.get(url, headers={"User-Agent": "Mozilla/5.0"}, timeout=20)
    response.raise_for_status()

    payload = response.json()
    raw = payload.get("submissionCalendar", {})
    if not isinstance(raw, dict):
        return {}

    counts: dict[str, int] = {}
    for key, value in raw.items():
        try:
            # Some APIs return unix timestamps as keys.
            date_key = _from_unix_to_iso_date(int(float(key)))
        except (TypeError, ValueError):
            # If key is already YYYY-MM-DD, keep it.
            date_key = str(key)
        try:
            counts[date_key] = counts.get(date_key, 0) + int(value or 0)
        except (TypeError, ValueError):
            continue

    return counts


def _fetch_leetcode_activity() -> dict:
    username = os.getenv("LEETCODE_USERNAME", "").strip()
    if not username:
        return _as_provider_payload(
            source="leetcode",
            label="LeetCode",
            username="",
            error="Set LEETCODE_USERNAME in backend environment",
        )

    try:
        counts = _extract_leetcode_calendar_from_graphql(username)
        note: str | None = None

        if not counts:
            counts = _extract_leetcode_calendar_from_fallback(username)
            note = "Using fallback LeetCode source for calendar data."

        if not counts:
            raise ValueError("LeetCode calendar data is unavailable for this profile")

        return _as_provider_payload(
            source="leetcode",
            label="LeetCode",
            username=username,
            data=_normalize_counts(counts),
            note=note,
        )
    except Exception as exc:
        return _as_provider_payload(
            source="leetcode",
            label="LeetCode",
            username=username,
            error=f"Failed to fetch LeetCode activity: {exc}",
        )


def _decode_monkeytype_last_day(last_day: int | float | None) -> date:
    if last_day is None:
        return date.today()

    value = int(last_day)

    # milliseconds timestamp
    if value > 10_000_000_000:
        return datetime.fromtimestamp(value / 1000, tz=timezone.utc).date()

    # seconds timestamp
    if value > 1_000_000_000:
        return datetime.fromtimestamp(value, tz=timezone.utc).date()

    # days since unix epoch
    if value > 10_000:
        return date(1970, 1, 1) + timedelta(days=value)

    return date.today()


def _fetch_monkeytype_activity() -> dict:
    username = os.getenv("MONKEYTYPE_USERNAME", "").strip()
    ape_key = os.getenv("MONKEYTYPE_APE_KEY", "").strip()

    if not ape_key:
        return _as_provider_payload(
            source="monkeytype",
            label="Monkeytype",
            username=username,
            error="Set MONKEYTYPE_APE_KEY in backend environment to enable Monkeytype activity",
        )

    try:
        response = requests.get(
            MONKEYTYPE_ACTIVITY_URL,
            headers={
                "Authorization": f"ApeKey {ape_key}",
                "User-Agent": "Mozilla/5.0",
            },
            timeout=20,
        )
        response.raise_for_status()

        payload = response.json().get("data", {})
        tests_by_days = payload.get("testsByDays", [])
        if not isinstance(tests_by_days, list):
            raise ValueError("Unexpected Monkeytype response format")

        last_day = payload.get("lastDay")
        last_date = _decode_monkeytype_last_day(last_day)
        first_date = last_date - timedelta(days=max(0, len(tests_by_days) - 1))

        counts: dict[str, int] = {}
        for idx, count in enumerate(tests_by_days):
            day = first_date + timedelta(days=idx)
            try:
                count_value = int(count or 0)
            except (TypeError, ValueError):
                count_value = 0
            counts[day.isoformat()] = max(count_value, 0)

        if not counts:
            raise ValueError("Monkeytype test activity is empty")

        return _as_provider_payload(
            source="monkeytype",
            label="Monkeytype",
            username=username,
            data=_normalize_counts(counts),
        )
    except Exception as exc:
        return _as_provider_payload(
            source="monkeytype",
            label="Monkeytype",
            username=username,
            error=f"Failed to fetch Monkeytype activity: {exc}",
        )


def _build_activity_payload() -> dict:
    providers = {
        "github": _fetch_github_activity(),
        "leetcode": _fetch_leetcode_activity(),
        "monkeytype": _fetch_monkeytype_activity(),
    }

    return {
        "updatedAt": datetime.now(timezone.utc).isoformat(),
        "cacheTtlSeconds": ACTIVITY_CACHE_TTL_SECONDS,
        "providers": providers,
    }


@activity_bp.route("/activity", methods=["GET"])
def activity():
    cached_payload = get_ttl_cache(ACTIVITY_CACHE_KEY, ACTIVITY_CACHE_TTL_SECONDS)
    if cached_payload:
        return jsonify({**cached_payload, "cached": True})

    payload = _build_activity_payload()
    set_ttl_cache(ACTIVITY_CACHE_KEY, payload)

    return jsonify({**payload, "cached": False})
