import { HomeAssistant } from "custom-card-helpers";

export default function getDefaultConfig(hass: HomeAssistant): object {
  function checkStrings(entiyId: string, testStrings: string[]): boolean {
    const friendlyName = hass.states[entiyId].attributes.friendly_name;
    return testStrings.some((str) => entiyId.includes(str) || friendlyName?.includes(str));
  }
  const powerEntities = Object.keys(hass.states).filter((entityId) => {
    const stateObj = hass.states[entityId];
    const isAvailable =
      (stateObj.state && stateObj.attributes && stateObj.attributes.device_class === "power") || stateObj.entity_id.includes("power");
    return isAvailable;
  });

  const gridPowerTestString = ["grid", "utility", "net", "meter"];
  const solarTests = ["solar", "pv", "photovoltaic", "inverter"];
  const batteryTests = ["battery"];
  const batteryPercentTests = ["battery_percent", "battery_level", "state_of_charge", "soc"];
  const firstGridPowerEntity = powerEntities.filter((entityId) => checkStrings(entityId, gridPowerTestString))[0];
  const firstSolarPowerEntity = powerEntities.filter((entityId) => checkStrings(entityId, solarTests))[0];
  const firstBatteryPowerEntity = powerEntities.filter((entityId) => checkStrings(entityId, batteryTests))[0];

  const percentageEntities = Object.keys(hass.states).filter((entityId) => {
    const stateObj = hass.states[entityId];
    const isAvailable = stateObj && stateObj.state && stateObj.attributes && stateObj.attributes.unit_of_measurement === "%";
    return isAvailable;
  });

  const firstBatteryPercentageEntity = percentageEntities.filter((entityId) => checkStrings(entityId, batteryPercentTests))[0];
  return {
    entities: {
      battery: (firstBatteryPowerEntity && firstBatteryPercentageEntity) ?? {
        entity: firstBatteryPowerEntity,
        state_of_charge: firstBatteryPercentageEntity,
      },
      grid: firstGridPowerEntity ? { entity: firstGridPowerEntity } : undefined,
      solar: firstSolarPowerEntity ? { entity: firstSolarPowerEntity } : undefined,
    },
    clickable_entities: true,
    watt_threshold: 1000,
  };
}
