"use client";

import { useState } from "react";
import { Button } from "@/src/components/ui/Button";
import { SimulatorFormValues } from "../types";
import { buildShareUrl } from "../utils/urlParams";

interface ShareSectionProps {
  values: SimulatorFormValues;
  disabled: boolean;
}

export function ShareSection({ values, disabled }: ShareSectionProps) {
  const [message, setMessage] = useState<string | null>(null);

  async function handleCopy() {
    try {
      const url = buildShareUrl(values, window.location.origin);
      await navigator.clipboard.writeText(url);
      setMessage("복사되었습니다");
      setTimeout(() => setMessage(null), 2000);
    } catch {
      setMessage("복사에 실패했습니다. 주소창의 URL을 직접 복사해주세요.");
    }
  }

  return (
    <div className="mt-4 flex flex-col gap-2">
      <Button variant="secondary" onClick={handleCopy} disabled={disabled} type="button">
        공유 링크 복사
      </Button>
      {message && (
        <p className="text-xs text-gray-600">{message}</p>
      )}
      <p className="text-xs text-gray-500">
        공유 링크에는 입력하신 연봉 등 재무 정보가 그대로 포함됩니다. 링크를 받은 사람은 누구나 볼 수 있으며, 이 서비스는 어떤 정보도 서버에 저장하지 않습니다.
      </p>
    </div>
  );
}
