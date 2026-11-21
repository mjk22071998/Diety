import React from "react";

export const Svg = React.forwardRef<any, any>(({ children, ...props }, ref) => (
  <svg ref={ref} {...props}>{children}</svg>
));
Svg.displayName = "Svg";

export const Path = (props: any) => <path {...props} />;
export const Rect = (props: any) => <rect {...props} />;
export const Circle = (props: any) => <circle {...props} />;
export const G = (props: any) => <g {...props} />;
export const Line = (props: any) => <line {...props} />;
export const Polyline = (props: any) => <polyline {...props} />;
export const Polygon = (props: any) => <polygon {...props} />;

export default {
  Svg,
  Path,
  Rect,
  Circle,
  G,
  Line,
  Polyline,
  Polygon,
};
