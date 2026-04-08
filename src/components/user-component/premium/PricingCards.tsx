"use client";

import React, { useState } from "react";
import { CheckCircle2, Loader2, Star, Zap } from "lucide-react";
import { toast } from "sonner";
import { useGetPlansQuery, useSubscribeMutation, useLazyGetSubscriptionPreviewQuery } from "@/store/services/subscriptionApi";
import { useFeatureAccess } from "@/hooks/useFeatureAccess";
import { SubscriptionTier, SubscriptionPreview } from "@/types/subscription";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { useRouter } from "next/navigation";

export default function PricingCards() {
  const router = useRouter();
  const { currentTier, user } = useFeatureAccess();
  const { data: plans, isLoading: isPlansLoading } = useGetPlansQuery();
  const [subscribePremium, { isLoading: isSubscribing }] = useSubscribeMutation();
  const [getPreview, { isFetching: isPreviewLoading }] = useLazyGetSubscriptionPreviewQuery();
  const [isOpen, setIsOpen] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState<{ id: string; name: string; price: number; tier: SubscriptionTier } | null>(null);
  const [previewData, setPreviewData] = useState<SubscriptionPreview | null>(null);

  const handleSubscribe = async () => {
    if (!selectedPlan) return;
    try {
      await subscribePremium({ tier: selectedPlan.tier }).unwrap();
      toast.success(`Nâng cấp ${selectedPlan.name} thành công! Chúc bạn học tốt.`);
      setIsOpen(false);
      router.push("/profile/subscription");
    } catch (err: any) {
      console.error("Lỗi khi nâng cấp:", err);
      const errorMsg = err?.data?.message || err?.message || "Có lỗi xảy ra, vui lòng thử lại sau";
      
      if (err?.data?.errorCode === "INSUFFICIENT_BALANCE" || errorMsg.toLowerCase().includes("số dư") || errorMsg.toLowerCase().includes("balance") || errorMsg.toLowerCase().includes("số dư ví không đủ")) {
        toast.error("Ví của bạn không đủ điểm. Đang chuyển hướng đến trang nạp tiền...");
        setTimeout(() => {
          router.push("/profile/wallet");
        }, 1500);
      } else {
        toast.error(errorMsg);
      }
      setIsOpen(false);
    }
  };

  const openDialog = async (plan: any) => {
    if (!user) {
      toast.info("Vui lòng đăng nhập để thao tác!");
      router.push("/login?redirect=/premium");
      return;
    }
    
    setSelectedPlan({ id: plan.id, name: plan.name, price: plan.price, tier: plan.tier as SubscriptionTier });
    try {
      const preview = await getPreview(plan.tier).unwrap();
      setPreviewData(preview);
      setIsOpen(true);
    } catch (err: any) {
      const errorMsg = err?.data?.message || err?.message || "Không thể lấy thông tin gói cước. Vui lòng thử lại.";
      toast.error(errorMsg);
    }
  };

  const fallbackPlans = [
    {
      id: "basic",
      tier: "BASIC",
      name: "BASIC",
      price: 0,
      features: [
        "Học course (video + quiz)",
        "Flashcard cơ bản (SRS)",
        "Luyện tập",
        "Mock test (giới hạn)",
        "Progress đơn giản"
      ],
      isPopular: false
    },
    {
      id: "pro",
      tier: "PRO",
      name: "PRO",
      price: 199000,
      features: [
        "Tất cả Basic",
        "Full Mock Test (N5–N1)",
        "Score breakdown",
        "Lịch sử học",
        "Tìm bạn call video ngẫu nhiên",
        "Sử dụng AI sensei giới hạn"
      ],
      isPopular: true
    },
    {
      id: "premium",
      tier: "PREMIUM",
      name: "PREMIUM",
      price: 399000,
      features: [
        "Tất cả PRO",
        "Mở full khóa học",
        "Study heatmap",
        "Sử dụng AI sensei không giới hạn",
        "AI learning path"
      ],
      isPopular: false
    }
  ];

  const displayPlans = plans && plans.length > 0 ? plans : fallbackPlans;

  const renderBadge = (plan: any) => {
    if (plan.tier === "PREMIUM") {
      return (
        <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 bg-gradient-to-r from-pink-500 to-fuchsia-500 text-white px-5 py-1.5 rounded-full text-[11px] font-bold tracking-widest flex items-center gap-1.5 whitespace-nowrap shadow-lg shadow-pink-500/30">
          <Zap className="w-3.5 h-3.5 fill-current" />
          AI PLATFORM
        </div>
      );
    }
    return null;
  };

  const getCardStyle = (tier: string) => {
    if (tier === "PREMIUM") {
      return "bg-gradient-to-b from-purple-800 to-indigo-950 text-white rounded-[2rem] border border-purple-500/30 flex flex-col relative shadow-[0_10px_40px_rgba(168,85,247,0.2)]";
    }
    if (tier === "PRO") {
      return "bg-[#0A0F1E] text-slate-200 rounded-[2rem] border border-pink-500 flex flex-col relative shadow-[0_0_30px_rgba(236,72,153,0.15)]";
    }
    return "bg-[#0A0F1E] text-slate-300 rounded-[2rem] flex flex-col relative";
  };

  const renderButton = (plan: any) => {
    const isCurrentPlan = currentTier === plan.tier;
    
    if (plan.tier === "BASIC") {
      return (
        <button disabled className="w-full bg-[#0F172A] text-slate-400 font-semibold py-3.5 rounded-xl transition mb-8 text-sm">
          {isCurrentPlan ? "Đang sử dụng" : "Mặc định"}
        </button>
      );
    }

    if (isCurrentPlan) {
      return (
        <button 
          onClick={() => router.push("/profile/subscription")}
          className="w-full bg-slate-800 border border-slate-700 font-bold py-3.5 text-sm rounded-xl transition mb-8"
        >
          Quản lý gói
        </button>
      );
    }

    if (plan.tier === "PREMIUM") {
      return (
        <button 
          onClick={() => openDialog(plan)}
          disabled={isPreviewLoading}
          className="w-full bg-gradient-to-r from-pink-500 to-purple-500 hover:from-pink-400 hover:to-purple-400 text-white font-bold py-3.5 text-sm rounded-xl transition mb-8 shadow-[0_0_20px_rgba(236,72,153,0.4)] flex justify-center items-center disabled:opacity-70"
        >
          {!user ? "Đăng nhập để Nâng cấp" : (isPreviewLoading ? <Loader2 className="w-5 h-5 animate-spin"/> : `Nâng cấp PREMIUM (AI Platform)`)}
        </button>
      );
    }

    return (
      <button 
        onClick={() => openDialog(plan)}
        disabled={isPreviewLoading}
        className="w-full bg-gradient-to-r from-pink-500 to-rose-400 hover:from-pink-400 hover:to-rose-300 text-white font-bold py-3.5 text-sm rounded-xl transition mb-8 shadow-[0_0_20px_rgba(244,63,94,0.4)] flex justify-center items-center disabled:opacity-70"
      >
        {!user ? "Đăng nhập để Nâng cấp" : (isPreviewLoading ? <Loader2 className="w-5 h-5 animate-spin"/> : `Nâng cấp PRO (Phổ biến nhất)`)}
      </button>
    );
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 w-full max-w-6xl">
      {isPlansLoading && <div className="col-span-1 lg:col-span-3 text-center py-10 opacity-50 flex items-center justify-center gap-3 text-slate-300">
        <Loader2 className="animate-spin w-5 h-5"/> Đang tải bảng giá...
      </div>}

      {!isPlansLoading && displayPlans.map((plan: any) => (
        <div key={plan.id || plan.tier} className={`p-8 lg:p-10 ${getCardStyle(plan.tier)}`}>
          {renderBadge(plan)}

          <p className={`${plan.tier === "PREMIUM" ? "text-purple-200" : (plan.tier === "PRO" ? "text-pink-400" : "text-slate-400")} text-[11px] font-bold tracking-widest mb-3 uppercase`}>
            {plan.tier === "PREMIUM" ? "Tối đa hiệu quả" : (plan.tier === "PRO" ? "Học nghiêm túc" : "Trải nghiệm")}
          </p>

          <h3 className="text-[28px] font-bold mb-4 leading-tight flex items-center gap-2">
            {plan.tier === "PRO" && <span className="text-yellow-400 text-2xl">Gói</span>}
            {plan.tier === "PREMIUM" && <span className="text-2xl">Gói</span>}
            {plan.name}
          </h3>

          <div className="flex items-end mb-8">
            <span className="text-[40px] font-black leading-none">{plan.price === 0 ? "0đ" : `${(plan.price / 1000)}k`}</span>
            <span className={`${plan.tier === "PREMIUM" ? "text-purple-200" : "text-slate-400"} ml-2 mb-1.5 text-sm`}>/ tháng</span>
          </div>

          {renderButton(plan)}

          <ul className="space-y-4 flex-1">
            {plan.features.map((feat: string, idx: number) => {
              const isHighlight = feat.toLowerCase().startsWith("tất cả");
              return (
                <li key={idx} className="flex items-start text-[13px] leading-relaxed">
                  <div className={`mt-0.5 mr-3 shrink-0 rounded-full flex items-center justify-center size-4 border ${plan.tier === "PREMIUM" ? "border-pink-300 text-pink-300" : (plan.tier === "PRO" ? "border-pink-500 text-pink-500" : "border-slate-500 text-slate-500")}`}>
                    <CheckCircle2 className="w-3 h-3" />
                  </div>
                  <span className={`${isHighlight ? "font-bold text-white" : ""}`}>{feat}</span>
                </li>
              );
            })}
          </ul>
        </div>
      ))}

      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Xác nhận nâng cấp</DialogTitle>
            <DialogDescription asChild>
              <div className="text-sm text-muted-foreground mt-2">
                {previewData?.isRenewal ? (
                  <div className="space-y-3">
                    <p className="flex items-center gap-2">
                      <CheckCircle2 className="w-4 h-4 text-green-500" />
                      <span>Bạn đang sử dụng gói <strong className="text-primary">{currentTier}</strong></span>
                    </p>
                    <p className="flex items-center gap-2">
                      <span className="text-xl">👉</span>
                      <span>Mua thêm sẽ được cộng dồn thời gian sử dụng.</span>
                    </p>
                    <div className="bg-muted/50 p-3 rounded-lg mt-2 space-y-1">
                      {previewData.currentExpireAt && (
                        <p className="text-xs flex justify-between">
                          <span>Hạn hiện tại:</span>
                          <strong>{new Date(previewData.currentExpireAt).toLocaleDateString('vi-VN')}</strong>
                        </p>
                      )}
                      <p className="text-xs flex justify-between">
                        <span>Sau khi mua:</span>
                        <strong className="text-pink-500">{new Date(previewData.newExpireAt).toLocaleDateString('vi-VN')}</strong>
                      </p>
                    </div>
                    <div className="pt-2 border-t mt-3 text-center">
                      Hệ thống sẽ trừ <strong className="text-pink-500">{(previewData.price || selectedPlan?.price || 0).toLocaleString('vi-VN')}đ</strong> vào số dư ví.
                    </div>
                  </div>
                ) : (
                  <div className="space-y-3">
                    <p>Bạn có chắc chắn nâng cấp gói <strong className="text-primary">{selectedPlan?.name}</strong> không?</p>
                    <div className="pt-2 border-t mt-3 text-center">
                      Hệ thống sẽ trừ trực tiếp <strong className="text-pink-500">{(previewData?.price || selectedPlan?.price || 0).toLocaleString('vi-VN')}đ</strong> vào số dư ví.
                    </div>
                  </div>
                )}
              </div>
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="mt-4">
            <Button variant="outline" onClick={() => setIsOpen(false)} disabled={isSubscribing}>
              Hủy bỏ
            </Button>
            <Button onClick={handleSubscribe} disabled={isSubscribing} className="bg-primary hover:bg-primary/90 text-white flex items-center">
              {isSubscribing && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Xác nhận
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}