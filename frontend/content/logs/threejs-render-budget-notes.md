# Three.js Render Budget Notes

Documented a render-budget-first approach for interactive 3D product visualization.

## Constraints

- Targeted stable frame pacing under varying camera paths.
- Capped material and light complexity for mobile-grade GPUs.
- Maintained visual fidelity while reducing draw-call pressure.

## Optimization Steps

- Reduced geometry complexity in non-focal scene regions.
- Cached animation states to avoid redundant updates.
- Applied selective post-processing only in active interaction states.

## Observability

```ts
const frameBudget = {
  targetFps: 60,
  maxFrameTimeMs: 16.6,
  alertFrameTimeMs: 22,
};
```

## Result

Scene remains interactive under heavier transitions with controlled rendering cost.
