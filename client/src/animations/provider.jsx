import { MotionConfig } from "framer-motion";

export default function AnimationProvider({ children }) {
  return (
    <MotionConfig reducedMotion="user">
      {children}
    </MotionConfig>
  );
}