import { LovelaceCardConfig } from "custom-card-helpers";

export interface PowerFlowCardConfig extends LovelaceCardConfig {
  entities: {
    battery?:
      | string
      | {
          consumption: string;
          production: string;
        };
    battery_charge?: string;
    grid:
      | string
      | {
          consumption: string;
          production?: string;
        };
    solar?: string;
  };
  kw_decimals: number;
  min_flow_rate: number;
  max_flow_rate: number;
  watt_threshold: number;
}
