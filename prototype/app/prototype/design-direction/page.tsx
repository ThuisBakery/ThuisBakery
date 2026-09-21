/*
  PROTOTYPE ONLY. Throwaway route for issue #13.

  Three variants of the ThuisBakery homepage, switchable via ?variant=,
  on /prototype/design-direction. They share a palette, a type system and
  a header, and disagree about everything else.
*/

import { Suspense } from "react";
import { PrototypeSwitcher } from "@/components/proto/PrototypeSwitcher";
import VariantA from "@/components/proto/VariantA";
import VariantB from "@/components/proto/VariantB";
import VariantC from "@/components/proto/VariantC";
import VariantD from "@/components/proto/VariantD";
import VariantE from "@/components/proto/VariantE";
import VariantF from "@/components/proto/VariantF";

export default async function Page({
  searchParams,
}: {
  searchParams: Promise<{ variant?: string }>;
}) {
  const { variant } = await searchParams;
  const key = (variant ?? "F").toUpperCase();

  return (
    <>
      {key === "A" ? (
        <VariantA />
      ) : key === "B" ? (
        <VariantB />
      ) : key === "C" ? (
        <VariantC />
      ) : key === "D" ? (
        <VariantD />
      ) : key === "E" ? (
        <VariantE />
      ) : (
        <VariantF />
      )}
      <Suspense fallback={null}>
        <PrototypeSwitcher />
      </Suspense>
    </>
  );
}
