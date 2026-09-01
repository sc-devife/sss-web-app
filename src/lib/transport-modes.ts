// Shared Mode / Vehicle-Type option lists for Transport — used by the
// library Transport page (TransportPanel.tsx) and the itinerary day
// planner's Add/Edit Transport form, so both stay in sync from one source.

import type { IconType } from "react-icons";
import {
  PiAirplaneTiltFill,
  PiTrainFill,
  PiBusFill,
  PiCarFill,
  PiTaxiFill,
  PiVanFill,
  PiBoatFill,
  PiMotorcycleFill,
  PiBicycleFill,
  PiPersonSimpleWalkFill,
  PiCableCarFill,
  PiHorseFill,
  PiJeepFill,
  PiDotsThreeCircleFill,
} from "react-icons/pi";
import { TbHelicopterFilled, TbFerryFilled } from "react-icons/tb";
import { FaShip } from "react-icons/fa6";
import { GiCamel } from "react-icons/gi";

export const MODE_OPTIONS = [
  { value: "flight", label: "Flight" },
  { value: "train", label: "Train" },
  { value: "bus", label: "Bus" },
  { value: "coach", label: "Coach" },
  { value: "car", label: "Car" },
  { value: "taxi", label: "Taxi / Cab" },
  { value: "van", label: "Van" },
  { value: "boat", label: "Boat" },
  { value: "ferry", label: "Ferry" },
  { value: "cruise", label: "Cruise" },
  { value: "helicopter", label: "Helicopter" },
  { value: "motorcycle", label: "Motorcycle" },
  { value: "bicycle", label: "Bicycle" },
  { value: "walking", label: "Walking" },
  { value: "cable_car", label: "Cable Car / Gondola" },
  { value: "funicular", label: "Funicular" },
  { value: "camel", label: "Camel" },
  { value: "horse", label: "Horse" },
  { value: "atv", label: "ATV / Jeep Safari" },
  { value: "other", label: "Other" },
];

export const VEHICLE_TYPE_OPTIONS: Record<string, { value: string; label: string }[]> = {
  flight: [
    { value: "economy", label: "Economy" },
    { value: "premium_economy", label: "Premium Economy" },
    { value: "business", label: "Business" },
    { value: "first", label: "First Class" },
  ],

  train: [
    { value: "chair_car", label: "Chair Car" },
    { value: "sleeper", label: "Sleeper" },
    { value: "ac_3_tier", label: "AC 3 Tier" },
    { value: "ac_2_tier", label: "AC 2 Tier" },
    { value: "first_class", label: "First Class" },
  ],

  bus: [
    { value: "mini_bus", label: "Mini Bus" },
    { value: "coach", label: "Coach" },
    { value: "sleeper_bus", label: "Sleeper Bus" },
    { value: "volvo", label: "Volvo Bus" },
  ],

  coach: [
    { value: "standard_coach", label: "Standard Coach" },
    { value: "luxury_coach", label: "Luxury Coach" },
  ],

  car: [
    { value: "hatchback", label: "Hatchback" },
    { value: "sedan", label: "Sedan" },
    { value: "suv", label: "SUV" },
    { value: "luxury", label: "Luxury Car" },
  ],

  taxi: [
    { value: "sedan", label: "Sedan" },
    { value: "suv", label: "SUV" },
    { value: "premium", label: "Premium Cab" },
  ],

  van: [
    { value: "minivan", label: "Minivan" },
    { value: "tempo_traveller", label: "Tempo Traveller" },
    { value: "passenger_van", label: "Passenger Van" },
  ],

  boat: [
    { value: "speed_boat", label: "Speed Boat" },
    { value: "houseboat", label: "Houseboat" },
    { value: "yacht", label: "Yacht" },
  ],

  ferry: [
    { value: "passenger_ferry", label: "Passenger Ferry" },
    { value: "vehicle_ferry", label: "Vehicle Ferry" },
  ],

  cruise: [
    { value: "river_cruise", label: "River Cruise" },
    { value: "ocean_cruise", label: "Ocean Cruise" },
  ],

  helicopter: [
    { value: "shared", label: "Shared Helicopter" },
    { value: "private", label: "Private Charter" },
  ],

  motorcycle: [
    { value: "motorcycle", label: "Motorcycle" },
    { value: "scooter", label: "Scooter" },
  ],

  bicycle: [
    { value: "standard", label: "Standard Bicycle" },
    { value: "mountain", label: "Mountain Bike" },
    { value: "electric", label: "Electric Bike" },
  ],

  walking: [],

  cable_car: [
    { value: "gondola", label: "Gondola" },
    { value: "cable_car", label: "Cable Car" },
  ],

  funicular: [
    { value: "funicular", label: "Funicular" },
  ],

  camel: [
    { value: "camel", label: "Camel" },
  ],

  horse: [
    { value: "horse", label: "Horse" },
  ],

  atv: [
    { value: "atv", label: "ATV" },
    { value: "jeep", label: "4x4 Jeep" },
  ],

  other: [],
};

// Per-mode icon, keyed by MODE_OPTIONS' value — used anywhere a transport
// item/option needs a distinct icon instead of one generic "transport"
// glyph for every mode (the itinerary Add Transport picker, day-timeline
// rows, etc).
const TRANSPORT_MODE_ICON: Record<string, IconType> = {
  flight: PiAirplaneTiltFill,
  train: PiTrainFill,
  bus: PiBusFill,
  coach: PiBusFill,
  car: PiCarFill,
  taxi: PiTaxiFill,
  van: PiVanFill,
  boat: PiBoatFill,
  ferry: TbFerryFilled,
  cruise: FaShip,
  helicopter: TbHelicopterFilled,
  motorcycle: PiMotorcycleFill,
  bicycle: PiBicycleFill,
  walking: PiPersonSimpleWalkFill,
  cable_car: PiCableCarFill,
  funicular: PiCableCarFill,
  camel: GiCamel,
  horse: PiHorseFill,
  atv: PiJeepFill,
  other: PiDotsThreeCircleFill,
};

export function transportModeIcon(modeCode: string | null | undefined): IconType {
  return (modeCode && TRANSPORT_MODE_ICON[modeCode]) || PiDotsThreeCircleFill;
}
