"use client";

import { useState } from "react";
import { useParams, useRouter } from "next/navigation";
import {
  useGetTestByIdQuery,
  useAddQuestionMutation,
  useUpdateQuestionMutation,
  useDeleteQuestionMutation,
  useUploadImageMutation,
  useUploadAudioMutation,
} from "@/store/services/adminJlptApi";
import type { JlptQuestionAdmin, CreateQuestionDTO } from "@/store/services/adminJlptApi";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
import { Badge } from "@/components/ui/badge";
import { Plus, Trash2, Upload, X } from "lucide-react";

export default function ManageQuestionsPage() {
  const params = useParams();
  const router = useRouter();
  const testId = Number(params.id);

  const { data: test, isLoading } = useGetTestByIdQuery(testId);
  const [addQuestion] = useAddQuestionMutation();
  const [updateQuestion] = useUpdateQuestionMutation();
  const [deleteQuestion] = useDeleteQuestionMutation();
  const [uploadImage] = useUploadImageMutation();
  const [uploadAudio] = useUploadAudioMutation();

  const [editingQuestion, setEditingQuestion] = useState<JlptQuestionAdmin | null>(null);
  const [formData, setFormData] = useState<CreateQuestionDTO>({
    mondaiNumber: 1,
    questionOrder: 1,
    section: "vocabulary",
    contentText: "",
    options: ["", "", "", ""],
    correctOption: 1,
    points: 1.0,
  });

  const [uploadingImage, setUploadingImage] = useState(false);
  const [uploadingAudio, setUploadingAudio] = useState(false);

  const questions = test?.questions || [];

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadingImage(true);
    try {
      const formData = new FormData();
      formData.append("file", file);
      const result = await uploadImage(formData).unwrap();
      
      setFormData(prev => ({ ...prev, imageMediaId: result.id }));
      alert("Upload ảnh thành công!");
    } catch (err) {
      alert("Upload ảnh thất bại!");
      console.error(err);
    } finally {
      setUploadingImage(false);
    }
  };

  const handleAudioUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadingAudio(true);
    try {
      const formDataObj = new FormData();
      formDataObj.append("file", file);
      const result = await uploadAudio(formDataObj).unwrap();
      
      setFormData(prev => ({ ...prev, audioMediaId: result.id }));
      alert("Upload audio thành công!");
    } catch (err) {
      alert("Upload audio thất bại!");
      console.error(err);
    } finally {
      setUploadingAudio(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      if (editingQuestion) {
        await updateQuestion({
          id: editingQuestion.id,
          data: formData,
        }).unwrap();
        alert("Cập nhật câu hỏi thành công!");
      } else {
        await addQuestion({
          testId,
          data: formData,
        }).unwrap();
        alert("Thêm câu hỏi thành công!");
      }

      // Reset form
      setFormData({
        mondaiNumber: formData.mondaiNumber,
        questionOrder: questions.length + 1,
        section: formData.section,
        contentText: "",
        options: ["", "", "", ""],
        correctOption: 1,
        points: 1.0,
      });
      setEditingQuestion(null);
    } catch (err) {
      alert("Lưu câu hỏi thất bại!");
      console.error(err);
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm("Xác nhận xóa câu hỏi này?")) return;

    try {
      await deleteQuestion(id).unwrap();
      alert("Xóa thành công!");
    } catch (err) {
      alert("Xóa thất bại!");
      console.error(err);
    }
  };

  const handleEdit = (question: JlptQuestionAdmin) => {
    setEditingQuestion(question);
    setFormData({
      mondaiNumber: question.mondaiNumber,
      mondaiTitle: question.mondaiTitle,
      questionOrder: question.questionOrder,
      section: question.section as any,
      contentText: question.contentText,
      imageMediaId: question.imageMediaId,
      audioMediaId: question.audioMediaId,
      options: question.options || ["", "", "", ""],
      correctOption: question.correctOption || 1,
      explanation: question.explanation,
      points: question.points,
    });
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  if (isLoading) {
    return <div className="text-center py-12">Đang tải...</div>;
  }

  if (!test) {
    return <div className="text-center py-12">Không tìm thấy đề thi</div>;
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">{test.title}</h1>
          <p className="text-muted-foreground mt-1">
            Quản lý câu hỏi • {questions.length} câu
          </p>
        </div>
        <Button variant="outline" onClick={() => router.back()}>
          Quay lại
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Question Form */}
        <div className="lg:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle>
                {editingQuestion ? "Chỉnh sửa câu hỏi" : "Thêm câu hỏi mới"}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-4">
                {/* Mondai & Order */}
                <div className="grid grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label>Mondai số</Label>
                    <Input
                      type="number"
                      min="1"
                      value={formData.mondaiNumber}
                      onChange={(e) => setFormData(prev => ({
                        ...prev,
                        mondaiNumber: parseInt(e.target.value)
                      }))}
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <Label>Thứ tự</Label>
                    <Input
                      type="number"
                      min="1"
                      value={formData.questionOrder}
                      onChange={(e) => setFormData(prev => ({
                        ...prev,
                        questionOrder: parseInt(e.target.value)
                      }))}
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <Label>Section</Label>
                    <Select
                      value={formData.section}
                      onValueChange={(value: any) => setFormData(prev => ({
                        ...prev,
                        section: value
                      }))}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="vocabulary">Vocabulary</SelectItem>
                        <SelectItem value="grammar">Grammar</SelectItem>
                        <SelectItem value="reading">Reading</SelectItem>
                        <SelectItem value="listening">Listening</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                {/* Content */}
                <div className="space-y-2">
                  <Label>Nội dung câu hỏi *</Label>
                  <Textarea
                    rows={4}
                    value={formData.contentText}
                    onChange={(e) => setFormData(prev => ({
                      ...prev,
                      contentText: e.target.value
                    }))}
                    placeholder="Nhập nội dung câu hỏi..."
                    required
                  />
                </div>

                {/* Media Upload */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Ảnh (tùy chọn)</Label>
                    <div className="flex gap-2">
                      <Input
                        type="file"
                        accept="image/*"
                        onChange={handleImageUpload}
                        disabled={uploadingImage}
                      />
                      {formData.imageMediaId && (
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => setFormData(prev => ({ ...prev, imageMediaId: undefined }))}
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                    {uploadingImage && <p className="text-xs text-muted-foreground">Đang upload...</p>}
                    {formData.imageMediaId && <p className="text-xs text-green-600">✓ Đã upload</p>}
                  </div>

                  <div className="space-y-2">
                    <Label>Audio (tùy chọn)</Label>
                    <div className="flex gap-2">
                      <Input
                        type="file"
                        accept="audio/*"
                        onChange={handleAudioUpload}
                        disabled={uploadingAudio}
                      />
                      {formData.audioMediaId && (
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => setFormData(prev => ({ ...prev, audioMediaId: undefined }))}
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                    {uploadingAudio && <p className="text-xs text-muted-foreground">Đang upload...</p>}
                    {formData.audioMediaId && <p className="text-xs text-green-600">✓ Đã upload</p>}
                  </div>
                </div>

                {/* Options */}
                <div className="space-y-3">
                  <Label>Đáp án (4 lựa chọn) *</Label>
                  {[0, 1, 2, 3].map(i => (
                    <div key={i} className="flex gap-2 items-center">
                      <Badge variant={formData.correctOption === i + 1 ? "default" : "outline"}>
                        {i + 1}
                      </Badge>
                      <Input
                        value={formData.options?.[i] || ""}
                        onChange={(e) => {
                          const newOptions = [...(formData.options || ["", "", "", ""])];
                          newOptions[i] = e.target.value;
                          setFormData(prev => ({ ...prev, options: newOptions }));
                        }}
                        placeholder={`Đáp án ${i + 1}`}
                        required
                      />
                      <Button
                        type="button"
                        variant={formData.correctOption === i + 1 ? "default" : "outline"}
                        size="sm"
                        onClick={() => setFormData(prev => ({ ...prev, correctOption: i + 1 }))}
                      >
                        Đúng
                      </Button>
                    </div>
                  ))}
                </div>

                {/* Explanation & Points */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Giải thích (tùy chọn)</Label>
                    <Textarea
                      rows={2}
                      value={formData.explanation || ""}
                      onChange={(e) => setFormData(prev => ({
                        ...prev,
                        explanation: e.target.value
                      }))}
                      placeholder="Giải thích đáp án đúng..."
                    />
                  </div>

                  <div className="space-y-2">
                    <Label>Điểm</Label>
                    <Input
                      type="number"
                      step="0.1"
                      min="0.1"
                      value={formData.points}
                      onChange={(e) => setFormData(prev => ({
                        ...prev,
                        points: parseFloat(e.target.value)
                      }))}
                    />
                  </div>
                </div>

                {/* Actions */}
                <div className="flex gap-2 pt-4">
                  <Button type="submit">
                    {editingQuestion ? "Cập nhật" : "Thêm câu hỏi"}
                  </Button>
                  {editingQuestion && (
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => {
                        setEditingQuestion(null);
                        setFormData({
                          mondaiNumber: 1,
                          questionOrder: questions.length + 1,
                          section: "vocabulary",
                          contentText: "",
                          options: ["", "", "", ""],
                          correctOption: 1,
                          points: 1.0,
                        });
                      }}
                    >
                      Hủy chỉnh sửa
                    </Button>
                  )}
                </div>
              </form>
            </CardContent>
          </Card>
        </div>

        {/* Question List */}
        <div className="space-y-3">
          <h3 className="font-semibold">Danh sách câu hỏi ({questions.length})</h3>
          
          {questions.length === 0 && (
            <Card className="p-6 text-center text-muted-foreground">
              <p>Chưa có câu hỏi nào</p>
              <p className="text-sm mt-2">Thêm câu hỏi đầu tiên →</p>
            </Card>
          )}

          {questions.map((q) => (
            <Card key={q.id} className="p-3">
              <div className="flex justify-between items-start gap-2">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <Badge variant="outline" className="text-xs">
                      M{q.mondaiNumber}-Q{q.questionOrder}
                    </Badge>
                    <Badge className="text-xs">{q.section}</Badge>
                  </div>
                  <p className="text-sm line-clamp-2">{q.contentText}</p>
                  {q.imageMediaId && <span className="text-xs text-blue-600">📷 Có ảnh</span>}
                  {q.audioMediaId && <span className="text-xs text-purple-600 ml-2">🔊 Có audio</span>}
                </div>
                <div className="flex gap-1">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleEdit(q)}
                  >
                    Sửa
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleDelete(q.id)}
                  >
                    <Trash2 className="h-4 w-4 text-destructive" />
                  </Button>
                </div>
              </div>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
}
