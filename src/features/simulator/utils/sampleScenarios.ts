import { SimulatorFormValues } from "../types";

interface SampleScenario {
  id: string;
  label: string;
  values: SimulatorFormValues;
}

export const SAMPLE_SCENARIOS: SampleScenario[] = [
  {
    id: "junior",
    label: "사회초년생",
    values: {
      currentSalary: "42,000,000",
      currentYearsOfService: "2",
      remainingYearsOfService: "28",
      salaryGrowthRate: "3",
      dcReturnRate: "5",
      conversionMethod: "TRANSFER_ALL_TO_DC",
      customTransferAmount: "",
    },
  },
  {
    id: "mid",
    label: "중간 경력",
    values: {
      currentSalary: "80,000,000",
      currentYearsOfService: "10",
      remainingYearsOfService: "15",
      salaryGrowthRate: "3",
      dcReturnRate: "5",
      conversionMethod: "TRANSFER_ALL_TO_DC",
      customTransferAmount: "",
    },
  },
  {
    id: "senior",
    label: "퇴직 임박",
    values: {
      currentSalary: "100,000,000",
      currentYearsOfService: "25",
      remainingYearsOfService: "5",
      salaryGrowthRate: "2",
      dcReturnRate: "4",
      conversionMethod: "TRANSFER_ALL_TO_DC",
      customTransferAmount: "",
    },
  },
];
