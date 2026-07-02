import type { Metadata } from "next";
import { SimulatorPage } from "@/src/features/simulator/SimulatorPage";

export const metadata: Metadata = {
  title: "DB/DC 퇴직연금 전환 시뮬레이터",
};

export default function Home() {
  return <SimulatorPage />;
}
