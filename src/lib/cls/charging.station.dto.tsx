// SPDX-FileCopyrightText: 2025 Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache-2.0

import type {
  ChargingStationCapabilityEnumType,
  ChargingStationDto,
  ChargingStationParkingRestrictionEnumType,
  ConnectorDto,
  ConnectorStatusEnumType,
  EvseDto,
  LocationDto,
  StatusNotificationDto,
} from '@citrineos/base';
import {
  ChargingStationSchema,
  LocationSchema,
  OCPP2_0_1,
  StatusNotificationSchema,
  TransactionSchema,
} from '@citrineos/base';
import { Expose } from 'class-transformer';
import { IsBoolean } from 'class-validator';
import type { Point } from 'geojson';
import { z } from 'zod';

const ChargingStationDetailsSchema = ChargingStationSchema.extend({
  location: LocationSchema.omit({ chargingPool: true }).optional(),
  statusNotifications: z.array(StatusNotificationSchema).optional(),
  transactions: z
    .array(TransactionSchema.omit({ station: true, location: true }))
    .optional(),
});

export const ChargingStationDetailsProps =
  ChargingStationDetailsSchema.keyof().enum;

export type ChargingStationDetailsDto = z.infer<
  typeof ChargingStationDetailsSchema
>;

const ChargingStationStatusCountsSchema = ChargingStationSchema.extend({
  statusNotifications: z.array(StatusNotificationSchema).optional(),
});

export type ChargingStationStatusCountsDto = z.infer<
  typeof ChargingStationStatusCountsSchema
>;

export class ChargingStationClass implements Partial<ChargingStationDto> {
  id!: number;
  ocppConnectionName!: string;
  @IsBoolean()
  isOnline!: boolean;
  protocol?: any;
  chargePointVendor?: string | null;
  chargePointModel?: string | null;
  chargePointSerialNumber?: string | null;
  chargeBoxSerialNumber?: string | null;
  firmwareVersion?: string | null;
  iccid?: string | null;
  imsi?: string | null;
  meterType?: string | null;
  meterSerialNumber?: string | null;
  coordinates?: Point | null;
  floorLevel?: string | null;
  parkingRestrictions?: ChargingStationParkingRestrictionEnumType[] | null;
  capabilities?: ChargingStationCapabilityEnumType[] | null;
  locationId?: number | null;
  @Expose({ name: 'StatusNotifications' })
  statusNotifications?: StatusNotificationDto[] | null;
  evses?: EvseDto[] | null;
  connectors?: ConnectorDto[] | null;
  // TODO: Add missing properties from ChargingStationDto
  location?: LocationDto;
  networkProfiles?: any;
  transactions?: any[] | null;
}

// TODO: Add missing enums and types for local use
export enum ChargingStationStatus {
  CHARGING = 'CHARGING',
  CHARGING_SUSPENDED = 'CHARGING_SUSPENDED',
  AVAILABLE = 'AVAILABLE',
  UNAVAILABLE = 'UNAVAILABLE',
  FAULTED = 'FAULTED',
}

export interface ChargingStationStatusCounts {
  [ChargingStationStatus.CHARGING]: number;
  [ChargingStationStatus.CHARGING_SUSPENDED]: number;
  [ChargingStationStatus.AVAILABLE]: number;
  [ChargingStationStatus.UNAVAILABLE]: number;
  [ChargingStationStatus.FAULTED]: number;
}

export const getChargingStationStatus = (
  chargingStation: ChargingStationStatusCountsDto,
) => {
  const counts = getChargingStationStatusCounts(chargingStation);

  if (counts[ChargingStationStatus.FAULTED] > 0) {
    return ChargingStationStatus.FAULTED;
  } else if (counts[ChargingStationStatus.CHARGING] > 0) {
    return ChargingStationStatus.CHARGING;
  } else if (counts[ChargingStationStatus.AVAILABLE] > 0) {
    return ChargingStationStatus.AVAILABLE;
  } else if (counts[ChargingStationStatus.CHARGING_SUSPENDED] > 0) {
    return ChargingStationStatus.CHARGING_SUSPENDED;
  } else if (counts[ChargingStationStatus.UNAVAILABLE] > 0) {
    return ChargingStationStatus.UNAVAILABLE;
  }
};

export const getChargingStationStatusCounts = (
  chargingStation: ChargingStationStatusCountsDto,
) => {
  const counts: ChargingStationStatusCounts = {
    [ChargingStationStatus.CHARGING]: 0,
    [ChargingStationStatus.CHARGING_SUSPENDED]: 0,
    [ChargingStationStatus.AVAILABLE]: 0,
    [ChargingStationStatus.UNAVAILABLE]: 0,
    [ChargingStationStatus.FAULTED]: 0,
  };
  const evses = chargingStation?.evses;
  if (evses && evses.length > 0) {
    for (const evse of evses) {
      // Support two response shapes from different queries:
      //   LatestStatusNotifications (PascalCase) + StatusNotification (detail query, no alias)
      //   latestStatusNotifications (camelCase) + statusNotification (overview query, aliased)
      const latestArr: any[] =
        (chargingStation as any).LatestStatusNotifications ||
        (chargingStation as any).latestStatusNotifications ||
        [];

      const matchedLsn = latestArr.find((lsn: any) => {
        const sn = lsn?.StatusNotification ?? lsn?.statusNotification;
        if (!sn) return false;
        // evseId in StatusNotification is the OCPP-level evse ID.
        // Match against evse.evseId (OCPP ID column) or evse.evseTypeId (fallback for overview query).
        const evseOcppId =
          (evse as any).evseId ?? (evse as any).evseTypeId;
        if (evseOcppId === null || evseOcppId === undefined) {
          // We have no evse identifier to match against (single-connector 1.6
          // station where it was never resolved) — an equally-unidentified
          // status notification is the only safe match.
          return sn.evseId === null;
        }
        // We know which evse this is: require an exact match. Treating any
        // null-evseId status notification as a wildcard here would let a
        // *different* connector's unidentified status win over this evse's
        // real, correctly-tagged one (seen on multi-connector 1.6 stations
        // where evseId is resolved inconsistently across StatusNotifications).
        return sn.evseId === evseOcppId;
      });

      let connectorStatus: ConnectorStatusEnumType | undefined;
      if (matchedLsn) {
        const sn =
          matchedLsn.StatusNotification ?? matchedLsn.statusNotification;
        connectorStatus = sn?.connectorStatus;
      } else {
        // Legacy path: flat statusNotifications array (OCPP 1.6 mapping via @Expose)
        const legacyMatch = chargingStation?.statusNotifications?.find(
          (sn) =>
            sn?.evseId === evse.id &&
            sn?.connectorId === evse.connectors?.[0]?.id,
        );
        connectorStatus = legacyMatch?.connectorStatus;
      }

      if (connectorStatus) {
        switch (connectorStatus) {
          case OCPP2_0_1.ConnectorStatusEnumType.Available:
            counts[ChargingStationStatus.AVAILABLE]++;
            break;
          case OCPP2_0_1.ConnectorStatusEnumType.Occupied: {
            // Only derive CHARGING from an active transaction when the station is online.
            // When offline, an open transaction is stale — show Unavailable instead.
            if ((chargingStation as any).isOnline) {
              const activeTransaction = (
                chargingStation as ChargingStationClass
              )?.transactions?.find(
                (transaction) => transaction.evseId === evse.id,
              );
              if (activeTransaction && activeTransaction.isActive) {
                const chargingState = activeTransaction.chargingState;
                if (
                  chargingState === OCPP2_0_1.ChargingStateEnumType.Charging
                ) {
                  counts[ChargingStationStatus.CHARGING]++;
                } else {
                  counts[ChargingStationStatus.CHARGING_SUSPENDED]++;
                }
              } else {
                counts[ChargingStationStatus.AVAILABLE]++;
              }
            } else {
              counts[ChargingStationStatus.UNAVAILABLE]++;
            }
            break;
          }
          case OCPP2_0_1.ConnectorStatusEnumType.Faulted:
            counts[ChargingStationStatus.FAULTED]++;
            break;
          case OCPP2_0_1.ConnectorStatusEnumType.Unavailable:
          case OCPP2_0_1.ConnectorStatusEnumType.Reserved:
          default:
            counts[ChargingStationStatus.UNAVAILABLE]++;
            break;
        }
      } else {
        counts[ChargingStationStatus.UNAVAILABLE]++;
      }
    }
  }
  return counts;
};
