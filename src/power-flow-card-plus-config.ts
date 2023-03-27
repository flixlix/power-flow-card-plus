import { LovelaceCardConfig } from "custom-card-helpers";
import { ComboEntity, IndividualDeviceType } from "./type.js";

export interface PowerFlowCardConfig extends LovelaceCardConfig {
  entities: {
    battery?: {
      entity: string | ComboEntity;
      state_of_charge?: string;
      name?: string;
      icon?: string;
      color?: ComboEntity;
      color_icon?: boolean | "production" | "consumption";
      display_state?: "two_way" | "one_way" | "one_way_no_zero";
    };
    grid?: {
      entity: string | ComboEntity;
      name?: string;
      icon?: string;
      color?: ComboEntity;
      color_icon?: boolean | "production" | "consumption";
      display_state?: "two_way" | "one_way" | "one_way_no_zero";
    };
    solar?: {
      entity: string;
      name?: string;
      icon?: string;
      color?: string;
      color_icon?: boolean;
    };
    home?: {
      entity: string;
      name?: string;
      icon?: string;
      color_icon?: boolean | "solar" | "grid" | "battery";
    };
    fossil_fuel_percentage?: {
      entity: string;
      name?: string;
      icon?: string;
      color?: string;
      display_zero?: boolean;
      state_type?: "percentage" | "power";
      color_icon?: boolean;
    };
    individual1?: IndividualDeviceType;
    individual2?: IndividualDeviceType;
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
