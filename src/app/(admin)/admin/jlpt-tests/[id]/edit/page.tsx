"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { useGetTestByIdQuery, useUpdateTestMutation } from "@/store/services/adminJlptApi";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";

export default function EditJLPTTestPage() {
  const params = useParams();
  const router = useRouter();
  const testId = Number(params.id);

  const { data: test, isLoading: loadingTest } = useGetTestByIdQuery(testId);
  const [updateTest, { isLoading: updating }] = useUpdateTestMutation();

  const [formData, setFormData] = useState({
    title: "",
    level: "N3" as "N5" | "N4" | "N3" | "N2" | "N1",
    testType: "full_test" as "full_test" | "vocabulary" | "grammar" | "reading" | "listening",
    description: "",
    duration: 120,
    totalQuestions: 0,
    passScore: 90,
    languageKnowledgePassScore: 19,
    readingPassScore: 19,
    listeningPassScore: 19,
    isPublished: false,
  });

  useEffect(() => {
    if (test) {
      setFormData({
        title: test.title,
        level: test.level as any,
        testType: test.testType as any,
        description: test.description || "",
        duration: test.duration,
        totalQuestions: test.totalQuestions,
        passScore: test.passScore,
        languageKnowledgePassScore: 19, // Backend doesn't return these, use defaults
        readingPassScore: 19,
        listeningPassScore: 19,
        isPublished: test.isPublished,
      });
    }
  }, [test]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      await updateTest({
        id: testId,
        data: formData,
      }).unwrap();
      alert("Cập nhật đề thi thành công!");
      router.push("/admin/jlpt-tests");
    } catch (err) {
      alert("Cập nhật thất bại!");
      console.error(err);
    }
  };

  const updateField = (field: string, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  if (loadingTest) {
    return <div className="text-center py-12">Đang tải...</div>;
  }

  if (!test) {
    return <div className="text-center py-12">Không tìm thấy đề thi</div>;
  }

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Chỉnh sửa đề thi</h1>
        <p className="text-muted-foreground mt-2">
          Cập nhật thông tin đề thi {test.title}
        </p>
      </div>

      <form onSubmit={handleSubmit}>
        <Card>
          <CardHeader>
            <CardTitle>Thông tin đề thi</CardTitle>
            <CardDescription>
              Các thông tin cơ bản về cấu trúc và cấu hình điểm của đề thi
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Title */}
            <div className="space-y-2">
              <Label htmlFor="title">Tiêu đề *</Label>
              <Input
                id="title"
                placeholder="VD: JLPT N3 Tháng 7/2024"
                value={formData.title}
                onChange={(e) => updateField("title", e.target.value)}
                required
              />
            </div>

            {/* Level & Test Type */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="level">Cấp độ *</Label>
                <Select
                  value={formData.level}
                  onValueChange={(value) => updateField("level", value)}
                >
                  <SelectTrigger id="level">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="N5">N5</SelectItem>
                    <SelectItem value="N4">N4</SelectItem>
                    <SelectItem value="N3">N3</SelectItem>
                    <SelectItem value="N2">N2</SelectItem>
                    <SelectItem value="N1">N1</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="testType">Loại đề thi *</Label>
                <Select
                  value={formData.testType}
                  onValueChange={(value) => updateField("testType", value)}
                >
                  <SelectTrigger id="testType">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="full_test">Full Test</SelectItem>
                    <SelectItem value="vocabulary">Vocabulary</SelectItem>
                    <SelectItem value="grammar">Grammar</SelectItem>
                    <SelectItem value="reading">Reading</SelectItem>
                    <SelectItem value="listening">Listening</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Description */}
            <div className="space-y-2">
              <Label htmlFor="description">Mô tả</Label>
              <Textarea
                id="description"
                placeholder="Mô tả ngắn về đề thi này..."
                rows={3}
                value={formData.description}
                onChange={(e) => updateField("description", e.target.value)}
              />
            </div>

            {/* Duration & Total Questions */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="duration">Thời gian (phút) *</Label>
                <Input
                  id="duration"
                  type="number"
                  min="1"
                  value={formData.duration}
                  onChange={(e) => updateField("duration", parseInt(e.target.value))}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="totalQuestions">Tổng số câu hỏi *</Label>
                <Input
                  id="totalQuestions"
                  type="number"
                  min="1"
                  value={formData.totalQuestions}
                  onChange={(e) => updateField("totalQuestions", parseInt(e.target.value))}
                  required
                />
              </div>
            </div>

            {/* Pass Scores */}
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="passScore">Điểm đỗ tổng *</Label>
                <Input
                  id="passScore"
                  type="number"
                  min="1"
                  max="180"
                  value={formData.passScore}
                  onChange={(e) => updateField("passScore", parseInt(e.target.value))}
                  required
                />
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="langPass">Điểm liệt ngôn ngữ</Label>
                  <Input
                    id="langPass"
                    type="number"
                    min="0"
                    value={formData.languageKnowledgePassScore}
                    onChange={(e) => updateField("languageKnowledgePassScore", parseInt(e.target.value))}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="readPass">Điểm liệt đọc</Label>
                  <Input
                    id="readPass"
                    type="number"
                    min="0"
                    value={formData.readingPassScore}
                    onChange={(e) => updateField("readingPassScore", parseInt(e.target.value))}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="listenPass">Điểm liệt nghe</Label>
                  <Input
                    id="listenPass"
                    type="number"
                    min="0"
                    value={formData.listeningPassScore}
                    onChange={(e) => updateField("listeningPassScore", parseInt(e.target.value))}
                  />
                </div>
              </div>
            </div>

            {/* Publish Status */}
            <div className="flex items-center space-x-2">
              <Checkbox
                id="isPublished"
                checked={formData.isPublished}
                onCheckedChange={(checked) => updateField("isPublished", checked)}
              />
              <Label htmlFor="isPublished" className="cursor-pointer">
                Xuất bản đề thi (hiển thị cho học viên)
              </Label>
            </div>

            {/* Actions */}
            <div className="flex gap-3 pt-4">
              <Button type="submit" disabled={updating}>
                {updating ? "Đang cập nhật..." : "Lưu thay đổi"}
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={() => router.push("/admin/jlpt-tests")}
              >
                Hủy
              </Button>
            </div>
          </CardContent>
        </Card>
      </form>
    </div>
  );
}
