import React from 'react';
import {
  Wallet,
  Smartphone,
  Landmark,
  Banknote,
  PiggyBank,
  TrendingUp,
  CreditCard,
} from 'lucide-react';

export interface WalletTypeOption {
  value: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
}

export const WALLET_TYPE_OPTIONS: WalletTypeOption[] = [
  { value: 'e-wallet', label: 'Ví điện tử', icon: Smartphone },
  { value: 'bank', label: 'Tài khoản ngân hàng', icon: Landmark },
  { value: 'cash', label: 'Tiền mặt', icon: Banknote },
  { value: 'savings', label: 'Sổ tiết kiệm', icon: PiggyBank },
  { value: 'investment', label: 'Quỹ đầu tư', icon: TrendingUp },
];

/**
 * Resolves proper wallet display type and matching Lucide icon.
 * Supports slug codes ('e-wallet', 'bank'), full Vietnamese labels, and
 * intelligent inference from wallet name for legacy records.
 */
export function resolveWalletTypeAndIcon(
  iconString?: string,
  walletName?: string
): { type: string; icon: React.ComponentType<{ className?: string }> } {
  const normalized = (iconString || '').trim().toLowerCase();

  // 1. Direct matches by slug code or Vietnamese label
  if (normalized === 'e-wallet' || normalized === 'ví điện tử' || normalized === 'vi dien tu') {
    return { type: 'Ví điện tử', icon: Smartphone };
  }
  if (normalized === 'bank' || normalized === 'tài khoản ngân hàng' || normalized === 'tai khoan ngan hang') {
    return { type: 'Tài khoản ngân hàng', icon: Landmark };
  }
  if (normalized === 'cash' || normalized === 'tiền mặt' || normalized === 'tien mat') {
    return { type: 'Tiền mặt', icon: Banknote };
  }
  if (
    normalized === 'savings' ||
    normalized === 'sổ tiết kiệm' ||
    normalized === 'so tiet kiem' ||
    normalized === 'tiết kiệm có kỳ hạn' ||
    normalized === 'tiet kiem co ky han'
  ) {
    return { type: 'Sổ tiết kiệm', icon: PiggyBank };
  }
  if (normalized === 'investment' || normalized === 'quỹ đầu tư' || normalized === 'quy dau tu') {
    return { type: 'Quỹ đầu tư', icon: TrendingUp };
  }
  if (normalized === 'credit' || normalized === 'thẻ tín dụng' || normalized === 'the tin dung') {
    return { type: 'Thẻ tín dụng', icon: CreditCard };
  }

  // 2. Intelligent inference for legacy wallets (where icon === 'wallet' or empty)
  const name = (walletName || '').toLowerCase();
  if (
    /ngân hàng|bank|bidv|vcb|vietcombank|mbbank|mb bank|techcombank|tcb|tpbank|acb|vpbank|sacombank|agribank|vib|shinhan|vietinbank|seabank|hdbank|ocb|msb|shb|lienvietpostbank/i.test(
      name
    )
  ) {
    return { type: 'Tài khoản ngân hàng', icon: Landmark };
  }
  if (/momo|zalopay|zalo pay|viettelpay|viettel pay|shopeepay|shopee pay|vnpay|vn pay|ví điện tử/i.test(name)) {
    return { type: 'Ví điện tử', icon: Smartphone };
  }
  if (/tiết kiệm|tích lũy|saving/i.test(name)) {
    return { type: 'Sổ tiết kiệm', icon: PiggyBank };
  }
  if (/đầu tư|cổ phiếu|chứng khoán|crypto|vàng|chứng chỉ quỹ/i.test(name)) {
    return { type: 'Quỹ đầu tư', icon: TrendingUp };
  }

  // Default fallback for legacy "wallet"
  return { type: 'Tiền mặt', icon: Wallet };
}
