import motion from "./motion.module.css";

export const riseInOrder = (order: number) => ({
  className: motion.rise,
  style: { "--order": order },
});
