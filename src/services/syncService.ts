import { supabase } from './supabase';
import { useStore, initialUsers } from '../store/useStore';

const SYNC_ROW_ID = 'artdict_master_state';

// Danh sách các state cần đồng bộ lên cloud
export const SYNC_KEYS = [
  'users',
  'projects',
  'clients',
  'teamMembers',
  'equipment',
  'equipmentChecklists',
  'calendarEvents',
  'postProductionTasks',
  'revisions',
  'expenses',
  'invoices',
  'notifications',
  'shotListItems',
  'settings'
] as const;

let isSyncingFromCloud = false;

// 1. Tải dữ liệu ban đầu từ Supabase khi mở ứng dụng
export async function initCloudSync() {
  try {
    const { data, error } = await supabase
      .from('artdict_sync')
      .select('data')
      .eq('id', SYNC_ROW_ID)
      .single();

    if (error && error.code !== 'PGRST116') {
      console.warn('Lỗi kết nối Supabase:', error.message);
      return;
    }

    if (data && data.data) {
      isSyncingFromCloud = true;
      const remoteState = data.data;
      
      // Đảm bảo luôn có tài khoản admin daensolit
      if (remoteState.users && Array.isArray(remoteState.users)) {
        const hasDaensolit = remoteState.users.some((u: any) => u.username === 'daensolit');
        if (!hasDaensolit) {
          remoteState.users = [...remoteState.users, initialUsers[0]];
        }
      }

      useStore.setState((state) => ({
        ...state,
        ...remoteState,
        // Giữ nguyên phiên đăng nhập hiện tại trên máy cá nhân
        currentUser: state.currentUser,
      }));
      isSyncingFromCloud = false;
    } else {
      // Nếu là lần đầu tiên chạy và Supabase chưa có data, đẩy local state lên làm master data
      await pushStateToCloud();
    }
  } catch (err) {
    console.warn('initCloudSync error:', err);
  } finally {
    isSyncingFromCloud = false;
  }

  // 2. Lắng nghe Realtime: Khi bất kỳ máy nào thay đổi data, cập nhật ngay về máy này
  supabase
    .channel('artdict_realtime')
    .on(
      'postgres_changes',
      {
        event: '*',
        schema: 'public',
        table: 'artdict_sync',
        filter: `id=eq.${SYNC_ROW_ID}`,
      },
      (payload: any) => {
        if (payload.new && payload.new.data) {
          isSyncingFromCloud = true;
          const remoteData = payload.new.data;
          useStore.setState((state) => ({
            ...state,
            ...remoteData,
            currentUser: state.currentUser,
          }));
          isSyncingFromCloud = false;
        }
      }
    )
    .subscribe();
}

let debounceTimer: any = null;

// 3. Đẩy thay đổi từ máy này lên Supabase (Debounced 500ms để tránh spam request)
export function pushStateToCloud() {
  if (isSyncingFromCloud) return;

  if (debounceTimer) clearTimeout(debounceTimer);

  debounceTimer = setTimeout(async () => {
    try {
      const state = useStore.getState();
      const payload: Record<string, any> = {};

      SYNC_KEYS.forEach((key) => {
        payload[key] = (state as any)[key];
      });

      await supabase.from('artdict_sync').upsert({
        id: SYNC_ROW_ID,
        data: payload,
        updated_at: new Date().toISOString(),
      });
    } catch (err) {
      console.warn('Lỗi đẩy dữ liệu lên Supabase:', err);
    }
  }, 500);
}
