export type Order = number;

declare module "react" {
  interface CSSProperties {
    readonly "--order"?: Order;
  }
}
