import {message as uiMessage} from "@/i18n/message";
export const JOB_STATUSES = [
  {
    id: "d7ba200a-6dc1-4ea8-acff-29ebb0d4676a",
    label: uiMessage("mebf12ef47cf5"),
    value: "draft",
  },
  {
    id: "5e7c6e8c-83e6-46e3-bf01-db8f0b503399",
    label: uiMessage("m0c79a9c22284"),
    value: "applied",
  },
  {
    id: "79ad373a-3af2-4d7b-8314-ba64d9fc055d",
    label: uiMessage("m4effe447355c"),
    value: "interview",
  },
  {
    id: "85d123b2-77c2-41f7-97a5-feebbe6f5e7b",
    label: uiMessage("m0cf57c63eb97"),
    value: "offer",
  },
  {
    id: "ed067643-9887-467d-b870-a5bad64de662",
    label: uiMessage("md75c96bf925d"),
    value: "offer-accepted",
  },
  {
    id: "ef09b767-29bb-4800-8713-daebe4600b41",
    label: uiMessage("m02fe344049ad"),
    value: "offer-declined",
  },
  {
    id: "2ff7fed9-82ed-43f5-89ff-e8a676c1c4fe",
    label: uiMessage("maea4a04a8042"),
    value: "rejected",
  },
  {
    id: "5cf01806-84ca-4fc4-8a19-986f595c8283",
    label: uiMessage("m424a2551d356"),
    value: "expired",
  },
  {
    id: "c3092324-da29-42d9-82a1-8125ea45660c",
    label: uiMessage("mbdb86505f806"),
    value: "archived",
  },
  {
    id: "3f2b6c41-88d5-4a0e-9d0a-6a1c9f0b7e22",
    label: uiMessage("m00c0b03fcfa2"),
    value: "withdrawn",
  },
];
