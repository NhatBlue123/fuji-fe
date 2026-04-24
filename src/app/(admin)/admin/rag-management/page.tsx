"use client";

import { useMemo, useState, useEffect, type ReactNode } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import GuideDocumentManager from "@/components/admin/GuideDocumentManager";
import { toast } from "sonner";
import {
  Brain,
  Database,
  Loader2,
  RefreshCw,
  RotateCcw,
  Search,
  Sparkles,
} from "lucide-react";

import {
  useGetRagOverviewQuery,
  useGetProductRagStatusQuery,
  useResetProductRagMutation,
  useIngestProductRagMutation,
  type RagIndexedFilter,
  type RagChangedFilter,
  type RagStaleFilter,
} from "@/store/services/admin/aiRagApi";

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

type ProductTab = "courses" | "plans";

function formatDateTime(v?: string | null) {
  if (!v) return "-";
  const d = new Date(v);
  if (Number.isNaN(d.getTime())) return "-";
  return d.toLocaleString("vi-VN");
}

function formatCurrency(amount: number, currency = "VND") {
  if (!Number.isFinite(amount)) return "-";
  if (amount <= 0) return "Miễn phí";
  return `${amount.toLocaleString("vi-VN")} ${currency}`;
}

function formatSecondsToText(seconds?: number) {
  if (!seconds || seconds <= 0) return "~ 1 giây";
  if (seconds < 60) return `~ ${seconds} giây`;
  const minutes = Math.floor(seconds / 60);
  const remain = seconds % 60;
  return remain > 0 ? `~ ${minutes} phút ${remain} giây` : `~ ${minutes} phút`;
}



function extractErrorMessage(error: unknown, fallback: string) {
  if (typeof error === "object" && error !== null) {
    const err = error as {
      data?: {
        error?: { message?: string };
        message?: string;
      };
      message?: string;
    };

    return (
      err.data?.error?.message || err.data?.message || err.message || fallback
    );
  }
  return fallback;
}

function StatusBadge({ indexed }: { indexed: boolean }) {
  return indexed ? (
    <Badge className="bg-emerald-100 text-emerald-700 hover:bg-emerald-100">
      Đã lập chỉ mục
    </Badge>
  ) : (
    <Badge variant="secondary">Chưa lập chỉ mục</Badge>
  );
}

function ActionTooltip({
  content,
  children,
  side = "top",
}: {
  content: string;
  children: ReactNode;
  side?: "top" | "right" | "bottom" | "left";
}) {
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <span className="inline-flex">{children}</span>
      </TooltipTrigger>
      <TooltipContent side={side}>{content}</TooltipContent>
    </Tooltip>
  );
}

export default function AdminRagManagementPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  
  const tabFromUrl = searchParams.get("tab") as "product" | "guide" | null;
  const [activeTab, setActiveTab] = useState<"product" | "guide">(
    tabFromUrl === "guide" ? "guide" : "product"
  );
  const [productSubTab, setProductSubTab] = useState<ProductTab>("courses");

  // Update URL when tab changes
  useEffect(() => {
    const currentTab = searchParams.get("tab");
    if (currentTab !== activeTab) {
      const params = new URLSearchParams(searchParams.toString());
      params.set("tab", activeTab);
      router.replace(`?${params.toString()}`, { scroll: false });
    }
  }, [activeTab, searchParams, router]);

  const [productKeyword, setProductKeyword] = useState("");

  const [indexedFilter, setIndexedFilter] = useState<RagIndexedFilter>("all");
  const [changedFilter, setChangedFilter] = useState<RagChangedFilter>("all");
  const [staleFilter, setStaleFilter] = useState<RagStaleFilter>("all");
  const [staleDays, setStaleDays] = useState(30);
  const [, setGuidePage] = useState(1);

  const [selectedCourseIds, setSelectedCourseIds] = useState<number[]>([]);
  const [selectedPlanIds, setSelectedPlanIds] = useState<number[]>([]);

  const productParams = useMemo(
    () => ({
      keyword: productKeyword || undefined,
      indexed: indexedFilter,
      changed: changedFilter,
      stale: staleFilter,
      staleDays,
    }),
    [productKeyword, indexedFilter, changedFilter, staleFilter, staleDays],
  );

  const overviewQuery = useGetRagOverviewQuery({ staleDays });
  const productsQuery = useGetProductRagStatusQuery(productParams);

  const [resetProductRag, resetProductState] = useResetProductRagMutation();
  const [ingestProductRag, ingestProductState] = useIngestProductRagMutation();

  const productData = productsQuery.data?.data;

  const courses = useMemo(() => productData?.courses ?? [], [productData]);
  const plans = useMemo(() => productData?.plans ?? [], [productData]);

  const courseIdSet = useMemo(
    () => new Set(courses.map((c) => c.id)),
    [courses],
  );
  const planIdSet = useMemo(() => new Set(plans.map((p) => p.id)), [plans]);

  const effectiveSelectedCourseIds = useMemo(
    () => selectedCourseIds.filter((id) => courseIdSet.has(id)),
    [selectedCourseIds, courseIdSet],
  );
  const effectiveSelectedPlanIds = useMemo(
    () => selectedPlanIds.filter((id) => planIdSet.has(id)),
    [selectedPlanIds, planIdSet],
  );

  const selectedCount =
    effectiveSelectedCourseIds.length + effectiveSelectedPlanIds.length;
  const isRefreshing =
    overviewQuery.isFetching ||
    productsQuery.isFetching;
  const productBusy =
    resetProductState.isLoading || ingestProductState.isLoading;

  const refreshAll = async () => {
    await Promise.all([
      overviewQuery.refetch(),
      productsQuery.refetch(),
    ]);
  };

  const handleRefresh = async () => {
    try {
      await refreshAll();
      toast.success("Đã làm mới trạng thái RAG");
    } catch {
      toast.error("Không thể làm mới dữ liệu");
    }
  };

  const handleResetProduct = async () => {
    const ok = window.confirm(
      "Bạn chắc chắn muốn đặt lại toàn bộ chỉ mục Sản phẩm (khóa học + gói)?",
    );
    if (!ok) return;

    try {
      const resp = await resetProductRag().unwrap();
      toast.success(resp.message || "Đã đặt lại RAG Sản phẩm");
      setSelectedCourseIds([]);
      setSelectedPlanIds([]);
      await refreshAll();
    } catch (error: unknown) {
      toast.error(extractErrorMessage(error, "Đặt lại RAG Sản phẩm thất bại"));
    }
  };

  const handleIngestProduct = async (mode: "all" | "selected" | "changed") => {
    if (mode === "selected" && selectedCount === 0) {
      toast.error("Bạn chưa chọn khóa học hoặc gói để nạp dữ liệu");
      return;
    }

    try {
      const payload =
        mode === "selected"
          ? {
              mode,
              courseIds: effectiveSelectedCourseIds,
              planIds: effectiveSelectedPlanIds,
            }
          : { mode };

      const resp = await ingestProductRag(payload).unwrap();
      toast.success(resp.message || "Nạp dữ liệu RAG Sản phẩm thành công");
      await refreshAll();
    } catch (error: unknown) {
      toast.error(
        extractErrorMessage(error, "Nạp dữ liệu RAG Sản phẩm thất bại"),
      );
    }
  };

  const toggleSelection = (
    current: number[],
    setFn: (value: number[]) => void,
    id: number,
    checked: boolean,
  ) => {
    if (checked) {
      if (current.includes(id)) return;
      setFn([...current, id]);
      return;
    }
    setFn(current.filter((x) => x !== id));
  };

  const isAllCoursesSelected =
    courses.length > 0 &&
    courses.every((c) => effectiveSelectedCourseIds.includes(c.id));
  const isAllPlansSelected =
    plans.length > 0 &&
    plans.every((p) => effectiveSelectedPlanIds.includes(p.id));

  const overview = overviewQuery.data?.data;

  return (
    <TooltipProvider delayDuration={120}>
      <div className="space-y-6">
        <div className="rounded-2xl border bg-card p-6">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-muted-foreground">
            Quản trị hệ thống
          </p>
          <h1 className="mt-2 flex items-center gap-2 text-3xl font-bold tracking-tight">
            <Brain className="h-8 w-8 text-primary" />
            Trung tâm điều khiển AI RAG
          </h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Quản trị bộ não RAG cho Sản phẩm và Hướng dẫn: theo dõi trạng thái
            chỉ mục, đặt lại dữ liệu, và nạp lại theo nhu cầu.
          </p>

          <div className="mt-4 flex flex-wrap gap-3">
            <ActionTooltip content="Tải lại dữ liệu trạng thái mới nhất từ máy chủ">
              <Button
                onClick={handleRefresh}
                disabled={isRefreshing}
                className="rounded-xl font-bold"
              >
                <RefreshCw
                  className={`mr-2 h-4 w-4 ${isRefreshing ? "animate-spin" : ""}`}
                />
                Làm mới trạng thái
              </Button>
            </ActionTooltip>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
          <div className="rounded-2xl border bg-card p-5">
            <p className="text-sm text-muted-foreground">Bộ sưu tập vector</p>
            <p className="mt-2 flex items-center gap-2 text-2xl font-bold">
              <Database className="h-5 w-5 text-primary" />
              {overview?.collection?.name || "product_knowledge"}
            </p>
            <p className="mt-1 text-sm text-muted-foreground">
              Product: {overview?.collection?.pointsCount ?? 0} điểm • Guide:{" "}
              {overview?.guideCollection?.pointsCount ?? 0} điểm
            </p>
            <p className="mt-1 text-sm text-muted-foreground">
              Product indexed: {overview?.collection?.indexedVectorsCount ?? 0}{" "}
              • Guide indexed:{" "}
              {overview?.guideCollection?.indexedVectorsCount ?? 0}
            </p>
          </div>

          <div className="rounded-2xl border bg-card p-5">
            <p className="text-sm text-muted-foreground">
              Ước tính đồng bộ Sản phẩm
            </p>
            <p className="mt-2 text-2xl font-bold">
              {formatSecondsToText(overview?.product?.estimate?.allSeconds)}
            </p>
            <p className="mt-1 text-sm text-muted-foreground">
              Chỉ mục có thay đổi:{" "}
              {formatSecondsToText(overview?.product?.estimate?.changedSeconds)}
            </p>
          </div>

          <div className="rounded-2xl border bg-card p-5">
            <p className="text-sm text-muted-foreground">
              Ước tính đồng bộ Hướng dẫn
            </p>
            <p className="mt-2 text-2xl font-bold">
              {formatSecondsToText(overview?.guide?.estimate?.ingestSeconds)}
            </p>
            <p className="mt-1 text-sm text-muted-foreground">
              Nguồn đã lập chỉ mục: {overview?.guide?.indexed ?? 0}/
              {overview?.guide?.total ?? 0}
            </p>
          </div>
        </div>

        <div className="rounded-2xl border bg-card p-5 space-y-4">
          <div className="flex flex-wrap gap-3">
            <div className="w-full md:w-[260px]">
              <Select
                value={indexedFilter}
                onValueChange={(v) => {
                  setIndexedFilter(v as RagIndexedFilter);
                }}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Lọc theo trạng thái chỉ mục" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Chỉ mục: Tất cả</SelectItem>
                  <SelectItem value="indexed">Đã lập chỉ mục</SelectItem>
                  <SelectItem value="not_indexed">Chưa lập chỉ mục</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="w-full md:w-[260px]">
              <Select
                value={changedFilter}
                onValueChange={(v) => {
                  setChangedFilter(v as RagChangedFilter);
                }}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Lọc theo thay đổi" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Thay đổi: Tất cả</SelectItem>
                  <SelectItem value="changed">Có thay đổi</SelectItem>
                  <SelectItem value="up_to_date">
                    Đã cập nhật mới nhất
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="w-full md:w-[220px]">
              <Select
                value={staleFilter}
                onValueChange={(v) => {
                  setStaleFilter(v as RagStaleFilter);
                  setGuidePage(1);
                }}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Lọc theo độ cũ" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Độ cũ: Tất cả</SelectItem>
                  <SelectItem value="stale">Cũ</SelectItem>
                  <SelectItem value="fresh">Mới</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="w-full md:w-[180px]">
              <Select
                value={String(staleDays)}
                onValueChange={(v) => {
                  setStaleDays(Number(v));
                  setGuidePage(1);
                }}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Ngưỡng ngày cũ" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="7">7 ngày</SelectItem>
                  <SelectItem value="30">30 ngày</SelectItem>
                  <SelectItem value="60">60 ngày</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <Tabs
            value={activeTab}
            onValueChange={(v) => setActiveTab(v as "product" | "guide")}
          >
            <TabsList>
              <TabsTrigger value="product">RAG Sản phẩm</TabsTrigger>
              <TabsTrigger value="guide">RAG Hướng dẫn</TabsTrigger>
            </TabsList>

            <TabsContent value="product" className="mt-4 space-y-4">
              <div className="flex flex-wrap items-center gap-3">
                <div className="relative w-full md:w-[360px]">
                  <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    value={productKeyword}
                    onChange={(e) => setProductKeyword(e.target.value)}
                    placeholder="Tìm khóa học hoặc gói..."
                    className="pl-9"
                  />
                </div>

                <ActionTooltip content="Xóa toàn bộ chỉ mục RAG của khóa học và gói, sau đó cần nạp lại dữ liệu">
                  <Button
                    variant="destructive"
                    onClick={handleResetProduct}
                    disabled={productBusy}
                    className="rounded-xl"
                  >
                    {resetProductState.isLoading ? (
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    ) : (
                      <RotateCcw className="mr-2 h-4 w-4" />
                    )}
                    Đặt lại RAG Sản phẩm
                  </Button>
                </ActionTooltip>

                <ActionTooltip content="Chỉ nạp lại các mục đã thay đổi kể từ lần lập chỉ mục gần nhất">
                  <Button
                    variant="outline"
                    onClick={() => handleIngestProduct("changed")}
                    disabled={productBusy}
                    className="rounded-xl"
                  >
                    {ingestProductState.isLoading ? (
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    ) : (
                      <Sparkles className="mr-2 h-4 w-4" />
                    )}
                    Nạp mục đã thay đổi
                  </Button>
                </ActionTooltip>

                <ActionTooltip content="Nạp lại toàn bộ khóa học và gói vào chỉ mục RAG">
                  <Button
                    variant="outline"
                    onClick={() => handleIngestProduct("all")}
                    disabled={productBusy}
                    className="rounded-xl"
                  >
                    Nạp toàn bộ
                  </Button>
                </ActionTooltip>

                <ActionTooltip content="Nạp lại chỉ các mục bạn đã tick trong bảng bên dưới">
                  <Button
                    onClick={() => handleIngestProduct("selected")}
                    disabled={productBusy || selectedCount === 0}
                    className="rounded-xl"
                  >
                    Nạp mục đã chọn ({selectedCount})
                  </Button>
                </ActionTooltip>
              </div>

              <Tabs
                value={productSubTab}
                onValueChange={(v) => setProductSubTab(v as ProductTab)}
              >
                <TabsList>
                  <TabsTrigger value="courses">
                    Khóa học (
                    {productsQuery.data?.data?.summary?.filtered?.courses ??
                      courses.length}
                    )
                  </TabsTrigger>
                  <TabsTrigger value="plans">
                    Gói đăng ký (
                    {productsQuery.data?.data?.summary?.filtered?.plans ??
                      plans.length}
                    )
                  </TabsTrigger>
                </TabsList>

                <TabsContent value="courses" className="mt-3">
                  <div className="rounded-xl border overflow-hidden">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead className="w-[52px]">
                            <Checkbox
                              checked={isAllCoursesSelected}
                              onCheckedChange={(checked) =>
                                setSelectedCourseIds(
                                  checked ? courses.map((c) => c.id) : [],
                                )
                              }
                            />
                          </TableHead>
                          <TableHead>Khóa học</TableHead>
                          <TableHead>Giá</TableHead>
                          <TableHead>Chỉ mục</TableHead>
                          <TableHead>Thay đổi</TableHead>
                          <TableHead>Độ cũ</TableHead>
                          <TableHead>Cập nhật nguồn</TableHead>
                          <TableHead>Lập chỉ mục lúc</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {productsQuery.isLoading && (
                          <TableRow>
                            <TableCell colSpan={8} className="text-center">
                              <Loader2 className="mx-auto h-5 w-5 animate-spin" />
                            </TableCell>
                          </TableRow>
                        )}

                        {!productsQuery.isLoading && courses.length === 0 && (
                          <TableRow>
                            <TableCell
                              colSpan={8}
                              className="text-center text-muted-foreground"
                            >
                              Không có khóa học phù hợp bộ lọc hiện tại.
                            </TableCell>
                          </TableRow>
                        )}

                        {courses.map((course) => (
                          <TableRow key={`course-${course.id}`}>
                            <TableCell>
                              <Checkbox
                                checked={effectiveSelectedCourseIds.includes(
                                  course.id,
                                )}
                                onCheckedChange={(checked) =>
                                  toggleSelection(
                                    effectiveSelectedCourseIds,
                                    setSelectedCourseIds,
                                    course.id,
                                    Boolean(checked),
                                  )
                                }
                              />
                            </TableCell>
                            <TableCell>
                              <div className="font-medium">{course.title}</div>
                              <div className="text-xs text-muted-foreground">
                                {course.level || "Tất cả"} •{" "}
                                {course.lessonCount || 0} bài •{" "}
                                {course.students || 0} học viên
                              </div>
                            </TableCell>
                            <TableCell>
                              {formatCurrency(course.price, course.currency)}
                            </TableCell>
                            <TableCell>
                              <StatusBadge indexed={course.indexed} />
                            </TableCell>
                            <TableCell>
                              {course.changed ? (
                                <Badge variant="secondary">Có thay đổi</Badge>
                              ) : (
                                <Badge className="bg-emerald-100 text-emerald-700 hover:bg-emerald-100">
                                  Đã cập nhật mới nhất
                                </Badge>
                              )}
                            </TableCell>
                            <TableCell>
                              {course.stale ? (
                                <Badge variant="destructive">
                                  Cũ ({course.staleDays ?? "-"} ngày)
                                </Badge>
                              ) : (
                                <Badge variant="outline">Mới</Badge>
                              )}
                            </TableCell>
                            <TableCell>
                              {formatDateTime(course.updatedAt)}
                            </TableCell>
                            <TableCell>
                              {formatDateTime(course.indexedAt)}
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                </TabsContent>

                <TabsContent value="plans" className="mt-3">
                  <div className="rounded-xl border overflow-hidden">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead className="w-[52px]">
                            <Checkbox
                              checked={isAllPlansSelected}
                              onCheckedChange={(checked) =>
                                setSelectedPlanIds(
                                  checked ? plans.map((p) => p.id) : [],
                                )
                              }
                            />
                          </TableHead>
                          <TableHead>Gói</TableHead>
                          <TableHead>Giá</TableHead>
                          <TableHead>Chỉ mục</TableHead>
                          <TableHead>Thay đổi</TableHead>
                          <TableHead>Độ cũ</TableHead>
                          <TableHead>Cập nhật nguồn</TableHead>
                          <TableHead>Lập chỉ mục lúc</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {productsQuery.isLoading && (
                          <TableRow>
                            <TableCell colSpan={8} className="text-center">
                              <Loader2 className="mx-auto h-5 w-5 animate-spin" />
                            </TableCell>
                          </TableRow>
                        )}

                        {!productsQuery.isLoading && plans.length === 0 && (
                          <TableRow>
                            <TableCell
                              colSpan={8}
                              className="text-center text-muted-foreground"
                            >
                              Không có gói phù hợp bộ lọc hiện tại.
                            </TableCell>
                          </TableRow>
                        )}

                        {plans.map((plan) => (
                          <TableRow key={`plan-${plan.id}`}>
                            <TableCell>
                              <Checkbox
                                checked={effectiveSelectedPlanIds.includes(
                                  plan.id,
                                )}
                                onCheckedChange={(checked) =>
                                  toggleSelection(
                                    effectiveSelectedPlanIds,
                                    setSelectedPlanIds,
                                    plan.id,
                                    Boolean(checked),
                                  )
                                }
                              />
                            </TableCell>
                            <TableCell>
                              <div className="font-medium">
                                {plan.displayName || plan.name}
                              </div>
                              <div className="text-xs text-muted-foreground">
                                {plan.durationDays || 0} ngày
                              </div>
                            </TableCell>
                            <TableCell>
                              {formatCurrency(plan.price, "VND")}
                            </TableCell>
                            <TableCell>
                              <StatusBadge indexed={plan.indexed} />
                            </TableCell>
                            <TableCell>
                              {plan.changed ? (
                                <Badge variant="secondary">Có thay đổi</Badge>
                              ) : (
                                <Badge className="bg-emerald-100 text-emerald-700 hover:bg-emerald-100">
                                  Đã cập nhật mới nhất
                                </Badge>
                              )}
                            </TableCell>
                            <TableCell>
                              {plan.stale ? (
                                <Badge variant="destructive">
                                  Cũ ({plan.staleDays ?? "-"} ngày)
                                </Badge>
                              ) : (
                                <Badge variant="outline">Mới</Badge>
                              )}
                            </TableCell>
                            <TableCell>
                              {formatDateTime(plan.updatedAt)}
                            </TableCell>
                            <TableCell>
                              {formatDateTime(plan.indexedAt)}
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                </TabsContent>
              </Tabs>
            </TabsContent>

            <TabsContent value="guide" className="mt-4 space-y-4">
              <GuideDocumentManager />
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </TooltipProvider>
  );
}
