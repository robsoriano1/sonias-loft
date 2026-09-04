export type InquiryStatus = "new" | "replied" | "confirmed" | "archived";

export type Inquiry = {
  id: string;
  created_at: string;
  name: string;
  email: string;
  phone: string | null;
  check_in: string | null;
  check_out: string | null;
  guests: number | null;
  message: string | null;
  status: InquiryStatus;
};

export type BlockedDate = {
  day: string; // "YYYY-MM-DD"
  note: string | null;
  created_at: string;
};
