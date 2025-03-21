// server/src/utils/dateUtils.ts
export const isValidDate = (dateString: string | Date | null | undefined): boolean => {
    if (!dateString) return false;
    const date = new Date(dateString);
    return !isNaN(date.getTime());
  };
  
  export const safeDate = (dateString: string | Date | null | undefined): Date | null => {
    if (!dateString) return null;
    const date = new Date(dateString);
    return isNaN(date.getTime()) ? null : date;
  };