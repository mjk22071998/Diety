import React from "react";
import { vi } from "vitest";

function flattenStyle(style: any) {
  if (!style) return undefined;
  if (!Array.isArray(style)) return style;
  return Object.assign({}, ...style.flat(Infinity).filter(Boolean));
}

export const View = React.forwardRef<any, any>(
  ({ children, testID, style, contentContainerStyle, ...props }, ref) => (
    <div
      ref={ref}
      data-testid={testID}
      style={flattenStyle(style)}
      {...props}
    >
      {children}
    </div>
  )
);
View.displayName = "View";

export const Text = React.forwardRef<any, any>(({ children, testID, style, numberOfLines, ...props }, ref) => (
  <span ref={ref} data-testid={testID} style={flattenStyle(style)} {...props}>
    {children}
  </span>
));
Text.displayName = "Text";

export const ScrollView = React.forwardRef<any, any>(
  ({ children, testID, style, contentContainerStyle, ...props }, ref) => (
    <div
      ref={ref}
      data-testid={testID}
      style={{ ...flattenStyle(style), ...flattenStyle(contentContainerStyle) }}
      {...props}
    >
      {children}
    </div>
  )
);
ScrollView.displayName = "ScrollView";

export const TouchableOpacity = React.forwardRef<any, any>(
  ({ children, testID, onPress, style, activeOpacity, accessibilityLabel, ...props }, ref) => (
    <button
      ref={ref}
      data-testid={testID}
      aria-label={accessibilityLabel}
      onClick={onPress}
      style={flattenStyle(style)}
      {...props}
    >
      {children}
    </button>
  )
);
TouchableOpacity.displayName = "TouchableOpacity";

export const Switch = React.forwardRef<any, any>(
  ({ value, onValueChange, testID, trackColor, thumbColor, ...props }, ref) => (
    <input
      ref={ref}
      type="checkbox"
      data-testid={testID}
      checked={!!value}
      onChange={(e) => onValueChange?.(e.target.checked)}
      {...props}
    />
  )
);
Switch.displayName = "Switch";

export const ActivityIndicator = React.forwardRef<any, any>(
  ({ testID, size, color, ...props }, ref) => (
    <div ref={ref} data-testid={testID} {...props}>
      Loading...
    </div>
  )
);
ActivityIndicator.displayName = "ActivityIndicator";

export const StyleSheet = {
  create: <T extends Record<string, any>>(styles: T): T => styles,
  flatten: (styles: any) => flattenStyle(styles),
};

export const Platform = {
  OS: "ios",
  select: (obj: any) => obj.ios || obj.default,
};

export const Alert = {
  alert: vi.fn(),
};

export default {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Switch,
  ActivityIndicator,
  StyleSheet,
  Platform,
  Alert,
};
