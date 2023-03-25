import { LovelaceCardConfig } from "custom-card-helpers";
import { ComboEntity } from "./type.js";

export interface PowerFlowCardConfig extends LovelaceCardConfig {
  entities: {
    battery?: string | ComboEntity;
    battery_charge?: string;
    grid: string | ComboEntity;
    solar?: string;
    home?: string;
    individual2?: {
      entity?: string;
      name?: string;
      icon?: string;
      color?: string;
      display_zero?: boolean;
    };
    individual1?: {
      entity?: string;
      name?: string;
      icon?: string;
      color?: string;
      display_zero?: boolean;
    };
  };
  dashboard_link?: string;
  inverted_entities: string | string[];
  kw_decimals: number;
  min_flow_rate: number;
  max_flow_rate: number;
  w_decimals: number;
  watt_threshold: number;
  clickable_entities: boolean;
}
