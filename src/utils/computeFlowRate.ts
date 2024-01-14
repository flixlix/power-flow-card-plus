import { PowerFlowCardPlusConfig } from "../power-flow-card-plus-config";

const newFlowRateMapRange = (value: number, minOut: number, maxOut: number, minIn: number, maxIn: number): number => {
  if (value > maxIn) return maxOut;
  return ((value - minIn) * (maxOut - minOut)) / (maxIn - minIn) + minOut;
};

const newFlowRate = (config: PowerFlowCardPlusConfig, value: number): number => {
  const maxPower = config.max_expected_power;
  const minPower = config.min_expected_power;
  const maxRate = config.max_flow_rate;
  const minRate = config.min_flow_rate;
  return newFlowRateMapRange(value, maxRate, minRate, minPower, maxPower);
};

const oldFlowRate = (config: PowerFlowCardPlusConfig, value: number, total: number): number => {
  const min = config?.min_flow_rate!;
  const max = config?.max_flow_rate!;
  return max - (value / (total > 0 ? total : value)) * (max - min);
};

export const computeFlowRate = (config: PowerFlowCardPlusConfig, value: number, total: number): number => {
  const isNewFlowRateModel = config.use_new_flow_rate_model ?? true;
  if (isNewFlowRateModel) return newFlowRate(config, value);
  return oldFlowRate(config, value, total);
};

export const computeIndividualFlowRate = (entry?: boolean | number, value?: number): number => {
  if (entry !== false && value) {
    return value;
  }
  if (typeof entry === "number") {
    return entry;
  }
  return 1.66;
};
