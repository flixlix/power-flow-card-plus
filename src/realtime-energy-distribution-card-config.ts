import { LovelaceCardConfig } from "custom-card-helpers";

export interface RealtimeEnergyDistributionCardConfig
  extends LovelaceCardConfig {
  entities: {
    battery?: string;
    battery_charge?: string;
    grid?: string;
    solar?: string;
  };
  min_flow_rate: number;
  max_flow_rate: number;
}
