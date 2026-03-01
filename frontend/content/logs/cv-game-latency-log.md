# CV Game Latency Log

Tracked end-to-end latency in a gesture-based game loop using camera input.

## Pipeline

- Frame capture
- Detection inference
- Gesture mapping
- Game state update
- Visual feedback render

## Stability Work

- Added temporal smoothing to reduce gesture jitter.
- Introduced confidence thresholding before state transitions.
- Debounced repeated actions caused by near-identical frame detections.

## Measurement

```ts
const latencyPipelineMs = {
  capture: 8,
  inference: 22,
  mapping: 3,
  stateUpdate: 2,
  render: 7,
};
```

## Result

Improved input consistency and reduced perceived control lag during rapid interactions.
