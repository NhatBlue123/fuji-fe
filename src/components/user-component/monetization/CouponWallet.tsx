"use client";

import Link from "next/link";
import { Copy, Ticket } from "lucide-react";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useGetMyCouponsQuery, type UserCoupon } from "@/store/services/userMonetizationApi";

function isExpired(coupon: UserCoupon) {
  return coupon.expiresAt ? new Date(coupon.expiresAt).getTime() <= Date.now() : false;
}

function groupCoupons(coupons: UserCoupon[]) {
  return {
    active: coupons.filter(
      (coupon) =>
        coupon.status === "ACTIVE" &&
        Number(coupon.usageRemaining ?? 0) > 0 &&
        !isExpired(coupon),
    ),
    used: coupons.filter(
      (coupon) =>
        coupon.status === "USED_UP" ||
        (coupon.status === "ACTIVE" && Number(coupon.usageRemaining ?? 0) <= 0),
    ),
    expired: coupons.filter((coupon) => coupon.status === "EXPIRED" || isExpired(coupon)),
  };
}

function discountLabel(
  coupon: UserCoupon,
  t: (key: string, options?: Record<string, unknown>) => string,
) {
  if (coupon.discountType === "PERCENT") {
    return t("monetization.messages.discountPercent", {
      value: coupon.discountValue,
    });
  }
  return t("monetization.messages.discountBlossom", {
    value: Number(coupon.discountValue || 0).toLocaleString("vi-VN"),
  });
}

function scopeLabel(
  scope: string,
  t: (key: string, options?: Record<string, unknown>) => string,
) {
  if (scope === "BOOKING") return t("monetization.terms.booking");
  if (scope === "COURSE") return t("monetization.terms.course");
  if (scope === "BOTH") return t("monetization.terms.bookingAndCourse");
  return scope;
}

function CouponCard({ coupon, active }: { coupon: UserCoupon; active: boolean }) {
  const { t } = useTranslation();
  const canUseBooking = coupon.scope === "BOOKING" || coupon.scope === "BOTH";
  const canUseCourse = coupon.scope === "COURSE" || coupon.scope === "BOTH";
  const statusLabel = active
    ? t("monetization.terms.active")
    : coupon.status === "USED_UP"
      ? t("monetization.terms.used")
      : coupon.status === "EXPIRED"
        ? t("monetization.terms.expired")
        : coupon.status;

  return (
    <Card className="rounded-2xl border-muted/70 bg-card/80">
      <CardContent className="p-5">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div className="space-y-2">
            <div className="flex flex-wrap items-center gap-2">
              <p className="font-mono text-lg font-black tracking-tight text-foreground">
                {coupon.code}
              </p>
              <Badge variant={active ? "default" : "outline"} className="rounded-full">
                {statusLabel}
              </Badge>
            </div>
            <p className="text-sm font-bold text-secondary">
              {discountLabel(coupon, t)} · {scopeLabel(coupon.scope, t)}
            </p>
            <p className="text-xs text-muted-foreground">
              {t("monetization.messages.remainingUsage", {
                remaining: coupon.usageRemaining,
                total: coupon.usageLimitTotal,
              })}
              {coupon.expiresAt
                ? ` · ${t("monetization.messages.expiresOn", {
                    date: new Date(coupon.expiresAt).toLocaleDateString("vi-VN"),
                  })}`
                : ""}
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button
              type="button"
              size="sm"
              variant="outline"
              disabled={!active}
              onClick={() => {
                navigator.clipboard.writeText(coupon.code);
                toast.success(t("monetization.messages.discountCodeCopied"));
              }}
              className="rounded-xl"
            >
              <Copy className="mr-2 size-4" />
              {t("common.copy")}
            </Button>
            {active && canUseBooking && (
              <Button asChild size="sm" className="rounded-xl">
                <Link href="/booking">{t("monetization.actions.bookLesson")}</Link>
              </Button>
            )}
            {active && canUseCourse && (
              <Button asChild size="sm" variant="secondary" className="rounded-xl">
                <Link href="/course">{t("monetization.actions.goToCourses")}</Link>
              </Button>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function CouponList({ coupons, active }: { coupons: UserCoupon[]; active: boolean }) {
  const { t } = useTranslation();
  if (coupons.length === 0) {
    return (
      <div className="rounded-2xl border border-dashed border-muted-foreground/30 py-12 text-center">
        <Ticket className="mx-auto mb-3 size-8 text-muted-foreground/40" />
        <p className="text-sm font-bold text-muted-foreground">
          {t("monetization.messages.emptyDiscountCodes")}
        </p>
      </div>
    );
  }

  return (
    <div className="grid gap-4">
      {coupons.map((coupon) => (
        <CouponCard key={coupon.id} coupon={coupon} active={active} />
      ))}
    </div>
  );
}

export function CouponWallet() {
  const { t } = useTranslation();
  const { data: coupons = [], isLoading } = useGetMyCouponsQuery();
  const grouped = groupCoupons(coupons);

  return (
    <Card className="rounded-[2rem] border-muted/60 bg-white/70 shadow-xl shadow-black/5 backdrop-blur-xl dark:border-white/5 dark:bg-[#0B1120]/70">
      <CardHeader>
        <div className="flex items-center gap-3">
          <div className="rounded-2xl border border-secondary/20 bg-secondary/10 p-3 text-secondary">
            <Ticket className="size-5" />
          </div>
          <div>
            <p className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground">
              {t("monetization.terms.discountCodeWallet")}
            </p>
            <CardTitle className="text-2xl font-black tracking-tight">
              {t("monetization.terms.discountCodes")}
            </CardTitle>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="space-y-3">
            {[0, 1, 2].map((item) => (
              <div key={item} className="h-28 animate-pulse rounded-2xl bg-muted" />
            ))}
          </div>
        ) : (
          <Tabs defaultValue="active">
            <TabsList className="mb-5">
              <TabsTrigger value="active">
                {t("monetization.terms.active")} ({grouped.active.length})
              </TabsTrigger>
              <TabsTrigger value="used">
                {t("monetization.terms.used")} ({grouped.used.length})
              </TabsTrigger>
              <TabsTrigger value="expired">
                {t("monetization.terms.expired")} ({grouped.expired.length})
              </TabsTrigger>
            </TabsList>
            <TabsContent value="active">
              <CouponList coupons={grouped.active} active />
            </TabsContent>
            <TabsContent value="used">
              <CouponList coupons={grouped.used} active={false} />
            </TabsContent>
            <TabsContent value="expired">
              <CouponList coupons={grouped.expired} active={false} />
            </TabsContent>
          </Tabs>
        )}
      </CardContent>
    </Card>
  );
}
