// Utility for handling feature and quota errors from API

export function isFeatureError(error: any): boolean {
  const code = error?.data?.error || error?.data?.code || error?.data?.status;
  return code === 'FEATURE_NOT_AVAILABLE' || code === 'QUOTA_EXCEEDED' || error?.status === 403;
}

export function getFeatureErrorMessage(error: any): string {
  if (error?.data?.message) {
    return error.data.message;
  }
  return 'Tính năng không khả dụng trong gói hiện tại. Vui lòng nâng cấp gói để sử dụng.';
}

export function getFeatureErrorCode(error: any): string | null {
  return error?.data?.error || error?.data?.code || null;
}
