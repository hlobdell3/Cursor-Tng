declare module 'fingerpose' {
  export class GestureDescription {
    constructor(name: string)
    addCurl(finger: any, curl: any, weight?: number): void
    addDirection(finger: any, direction: any, weight?: number): void
  }

  export class GestureEstimator {
    constructor(gestures: any[])
    estimate(landmarks: number[][], threshold: number): any
  }

  export const Finger: {
    Thumb: any
    Index: any
    Middle: any
    Ring: any
    Pinky: any
  }

  export const FingerCurl: {
    NoCurl: any
    HalfCurl: any
    FullCurl: any
  }

  export const FingerDirection: {
    VerticalUp: any
    VerticalDown: any
    HorizontalLeft: any
    HorizontalRight: any
    DiagonalUpRight: any
    DiagonalUpLeft: any
    DiagonalDownRight: any
    DiagonalDownLeft: any
  }

  export const Gestures: {
    VictoryGesture: any
    ThumbsUpGesture: any
  }
} 