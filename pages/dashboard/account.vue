<script setup lang="ts">
import { useEventBus } from '@vueuse/core';
import { importInfos, type Info } from '~/store/v2/info';
import GlobalSearchAccount from '~/components/global/SearchAccount.vue';
import { AgGridVue } from 'ag-grid-vue3';
import {
  type ColDef,
  type GetRowIdParams,
  type GridApi,
  type GridOptions,
  type GridReadyEvent,
  type ICellRendererParams,
  type IDateFilterParams,
  type SelectionChangedEvent,
  themeQuartz,
  type ValueFormatterParams,
  type ValueGetterParams,
} from 'ag-grid-community';
import { AG_GRID_LOCALE_CN } from '@ag-grid-community/locale';
import GridLoading from '~/components/grid/Loading.vue';
import GridNoRows from '~/components/grid/NoRows.vue';
import { deleteAccountData } from '~/store/v2';
import { getAllInfo, getInfoCache } from '~/store/v2/info';
import { getArticleList } from '~/apis';
import { getArticleCache, hitCache } from '~/store/v2/article';
import GridAccountActions from '~/components/grid/AccountActions.vue';
import GridLoadProgress from '~/components/grid/LoadProgress.vue';
import ConfirmModal from '~/components/modal/Confirm.vue';
import LoginModal from '~/components/modal/Login.vue';
import { formatTimeStamp } from '~/utils';
import type { Preferences } from '~/types/preferences';
import dayjs from 'dayjs';
import { IMAGE_PROXY, websiteName } from '~/config';
import toastFactory from '~/composables/toast';
import { exportAccountJsonFile } from '~/utils/exporter';
import type { AccountManifest } from '~/types/account';
import type { AccountEvent } from '~/types/events';
import { onMounted, onBeforeUnmount } from 'vue';

useHead({
  title: `公众号管理 | ${websiteName}`,
});

interface PromiseInstance {
  resolve: (value: unknown) => void;
  reject: (reason?: any) => void;
}

const toast = toastFactory();
const modal = useModal();

const preferences = usePreferences();
const loginAccount = useLoginAccount();
// 账号事件总线，用于和 Credentials 面板保持列表同步
const accountEventBus = useEventBus<AccountEvent>('account-event');
const stopAccountEvent = accountEventBus.on(event => {
  if (event.type === 'account-added' || event.type === 'account-removed') {
    refresh();
  }
});

const searchAccountRef = ref<typeof GlobalSearchAccount | null>(null);

// 检查是否有登录信息
function checkLogin() {
  if (loginAccount.value === null) {
    modal.open(LoginModal);
    return false;
  }
  return true;
}

const addBtnLoading = ref(false);
function addAccount() {
  if (!checkLogin()) return;

  searchAccountRef.value!.open();
}
async function onSelectAccount(account: Info) {
  addBtnLoading.value = true;
  await loadAccountArticle(account, false);
  await refresh();
  addBtnLoading.value = false;
  toast.success('公众号添加成功', `已成功添加公众号【${account.nickname}】，并拉取了第一页文章数据`);
  // 通知 Credentials 面板按钮立即变更为“已添加”
  accountEventBus.emit({ type: 'account-added', fakeid: account.fakeid });
}

const isCanceled = ref(false);
const timer = ref<number | null>(null);

const syncToTimestamp = computed(() => {
  const syncDateRange = (preferences.value as unknown as Preferences).syncDateRange;
  switch (syncDateRange) {
    case '1d':
      return dayjs().subtract(1, 'days').unix();
    case '3d':
      return dayjs().subtract(3, 'days').unix();
    case '7d':
      return dayjs().subtract(7, 'days').unix();
    case '1m':
      return dayjs().subtract(1, 'months').unix();
    case '3m':
      return dayjs().subtract(3, 'months').unix();
    case '6m':
      return dayjs().subtract(6, 'months').unix();
    case '1y':
      return dayjs().subtract(1, 'years').unix();
    case 'all':
    default:
      return 0;
  }
});

async function _load(account: Info, begin: number, loadMore: boolean, promise: PromiseInstance) {
  if (isCanceled.value) {
    isCanceled.value = false;
    promise.reject(new Error('已取消'));
    return;
  }

  syncingRowId.value = account.fakeid;
  isSyncing.value = true;

  const [articles, completed] = await getArticleList(account, begin);
  if (isCanceled.value) {
    isCanceled.value = false;
    promise.reject(new Error('已取消'));
    return;
  }
  if (completed) {
    await updateRow(account.fakeid);
    syncingRowId.value = null;
    isSyncing.value = false;
    promise.resolve(account);
    return;
  }

  const count = articles.filter(article => article.itemidx === 1).length;
  begin += count;

  // 加载可用的缓存
  const lastArticle = articles.at(-1);
  if (lastArticle && lastArticle.create_time < account.last_update_time!) {
    // 检查是否存在比 lastArticle 更早的缓存数据
    if (await hitCache(account.fakeid, lastArticle.create_time)) {
      const cachedArticles = await getArticleCache(account.fakeid, lastArticle.create_time);

      // 更新 begin 参数
      const count = cachedArticles.filter(article => article.itemidx === 1).length;
      begin += count;
      articles.push(...cachedArticles);
    }
  }
  if (articles.at(-1)!.create_time < syncToTimestamp.value) {
    // 已同步到配置的时间范围
    await updateRow(account.fakeid);
    syncingRowId.value = null;
    isSyncing.value = false;
    promise.resolve(account);
    return;
  }

  await updateRow(account.fakeid);
  if (loadMore) {
    timer.value = window.setTimeout(
      () => {
        if (isCanceled.value) {
          console.warn('已取消');
          isCanceled.value = false;
          promise.reject(new Error('已取消'));
          return;
        }
        _load(account, begin, true, promise);
      },
      ((preferences.value as unknown as Preferences).accountSyncSeconds || 5) * 1000
    );
  } else {
    syncingRowId.value = null;
    isSyncing.value = false;
    promise.resolve(account);
  }
}

// 同步指定公众号
async function loadAccountArticle(account: Info, loadMore = true) {
  return new Promise((resolve, reject) => {
    const promise: PromiseInstance = { resolve, reject };

    _load(account, 0, loadMore, promise).catch(e => {
      syncingRowId.value = null;
      isSyncing.value = false;

      if (e.message === 'session expired') {
        modal.open(LoginModal);
      }
      reject(e);
    });
  });
}

// 同步所有公众号
async function loadSelectedAccountArticle() {
  if (!checkLogin()) return;

  // 重置取消状态
  isCanceled.value = false;

  try {
    const rows = getSelectedRows();
    console.log(`开始同步 ${rows.length} 个公众号`);
    
    let successCount = 0;
    let failCount = 0;
    const failedAccounts: string[] = [];
    
    // 遍历所有选中的公众号，逐个同步
    for (const account of rows) {
      // 检查是否被取消
      if (isCanceled.value) {
        console.log('同步已取消');
        break;
      }
      
      try {
          // 确保fakeid存在
          const fakeid = account.fakeid;
          if (!fakeid) {
            console.warn(`公众号 ${account.nickname} 缺少fakeid，跳过同步`);
            failCount++;
            failedAccounts.push(account.nickname);
            continue;
          }
          
          console.log(`正在同步公众号: ${account.nickname} (${fakeid})`,new Date().toLocaleString());
          // 直接设置当前正在同步的公众号ID
          syncingRowId.value = fakeid;
          
          await loadAccountArticle(account);
          successCount++;
      } catch (e: any) {
        failCount++;
        failedAccounts.push(account.nickname);
        console.error(`公众号 ${account.nickname} 同步失败:`, e.message);
        // 继续处理下一个公众号，不中断整个循环
        break;
      }
    }
    
    // 更新全局同步状态
    isSyncing.value = false;
    syncingRowId.value = null;
    
    // 根据同步结果显示不同的通知
    if (successCount > 0) {
      toast.success(`同步完成`, `成功同步 ${successCount} 个公众号${failCount > 0 ? `，失败 ${failCount} 个` : ''}`);
    }
    
    if (failCount > 0) {
      console.error(`同步失败的公众号:`, failedAccounts);
      toast.error('部分同步失败', `有 ${failCount} 个公众号同步失败，请查看控制台获取详细信息`);
    }
  } catch (e: any) {
    console.error('批量同步过程中发生错误:', e);
    toast.error('批量同步失败', e.message);
    // 确保错误情况下重置状态
    isSyncing.value = false;
    syncingRowId.value = null;
  }
}

const autoCronExecting = ref(false);

// 启动自动同步任务
function startAutoSync() {
  if (!checkLogin()) return;

  if (autoCronExecting.value){
    return;
  }

  if (isAutoSyncEnabled.value && autoSyncInterval.value > 0) {
    // 设置定时器，时间间隔转换为毫秒
    autoSyncTimer.value = window.setInterval(() => {
      if (autoCronExecting.value){
        return;
      }
      autoCronExecting.value = true;
      console.log('执行定时自动同步任务');
      loadSelectedAccountArticle().finally(() => {
        autoCronExecting.value = false;
      }); 
    }, autoSyncInterval.value * 60 * 1000);
    
    console.log(`自动同步任务已启动，间隔时间：${autoSyncInterval.value} 分钟`);
    toast.success('自动同步已启动', `将每隔 ${autoSyncInterval.value} 分钟自动同步所选公众号`);
  }
}

// 停止自动同步任务
function stopAutoSync() {
  if (autoSyncTimer.value) {
    window.clearInterval(autoSyncTimer.value);
    autoSyncTimer.value = null;
    console.log('自动同步任务已停止');
  }
}

// 处理自动同步开关变化
function handleAutoSyncToggle() {
  if (isAutoSyncEnabled.value) {
    // 验证是否有选中的公众号
    const rows = getSelectedRows();
    if (rows.length === 0) {
      toast.error('无法启用自动同步', '请先选择要同步的公众号');
      isAutoSyncEnabled.value = false;
      return;
    }
    stopAutoSync();
    // 启动自动同步
    startAutoSync();
    // 保存设置
    saveAutoSyncSettings();
  } else {
    // 停止自动同步
    stopAutoSync();
    toast.info('自动同步已关闭');
    // 保存设置
    saveAutoSyncSettings();
  }
}

// 处理时间间隔变化
function handleIntervalChange() {
  // 确保时间间隔在有效范围内
  if (autoSyncInterval.value < 1) autoSyncInterval.value = 1;
  if (autoSyncInterval.value > 1440) autoSyncInterval.value = 1440;
  
  // 如果自动同步已启用，重新启动定时器
  if (isAutoSyncEnabled.value) {
    stopAutoSync();
    startAutoSync();
    // 保存设置
    saveAutoSyncSettings();
  }
}

// 保存自动同步设置到本地存储
function saveAutoSyncSettings() {
  try {
    const settings = {
      enabled: isAutoSyncEnabled.value,
      interval: autoSyncInterval.value
    };
    localStorage.setItem('wechat-article-exporter-auto-sync', JSON.stringify(settings));
    console.log('自动同步设置已保存');
  } catch (error) {
    console.error('保存自动同步设置失败:', error);
  }
}

// 从本地存储加载自动同步设置
function loadAutoSyncSettings() {
  try {
    const savedSettings = localStorage.getItem('wechat-article-exporter-auto-sync');
    if (savedSettings) {
      const settings = JSON.parse(savedSettings);
      isAutoSyncEnabled.value = settings.enabled || false;
      autoSyncInterval.value = settings.interval || 60;
      console.log('已加载自动同步设置');
    }
  } catch (error) {
    console.error('加载自动同步设置失败:', error);
  }
}

const isDeleting = ref(false);
const isSyncing = ref(false);
const syncingRowId = ref<string | null>(null);

// 定时任务相关状态变量
const isAutoSyncEnabled = ref(false); // 是否启用自动同步
const autoSyncTimer = ref<number | null>(null); // 自动同步的定时器ID
const autoSyncInterval = ref(60); // 自动同步的时间间隔（分钟）

let globalRowData: Info[] = [];

const filterParams: IDateFilterParams = {
  filterOptions: ['lessThan', 'greaterThan', 'inRange'],
  comparator: (filterLocalDateAtMidnight: Date, cellValue: Date) => {
    const t = filterLocalDateAtMidnight;
    if (cellValue < t) {
      return -1;
    } else if (cellValue === t) {
      return 0;
    } else {
      return 1;
    }
  },
};
const booleanColumnFilterParams = {
  suppressMiniFilter: true,
  values: [true, false],
  valueFormatter: (params: ValueFormatterParams) => (params.value ? '是' : '否'),
};

const columnDefs = ref<ColDef[]>([
  {
    colId: 'fakeid',
    headerName: 'fakeid',
    field: 'fakeid',
    cellDataType: 'text',
    filter: 'agTextColumnFilter',
    minWidth: 200,
    cellClass: 'font-mono',
    initialHide: true,
  },
  {
    colId: 'round_head_img',
    headerName: '头像',
    field: 'round_head_img',
    sortable: false,
    filter: false,
    cellRenderer: (params: ICellRendererParams) => {
      return `<img alt="" src="${IMAGE_PROXY + params.value}" style="height: 30px; width: 30px; object-fit: cover; border: 1px solid #e5e7eb; border-radius: 100%;" />`;
    },
    cellClass: 'flex justify-center items-center',
    minWidth: 80,
  },
  {
    colId: 'nickname',
    headerName: '名称',
    field: 'nickname',
    cellDataType: 'text',
    filter: 'agTextColumnFilter',
    filterParams: {
      filterOptions: ['contains', 'notContains'],
      maxNumConditions: 1,
    },
    tooltipField: 'nickname',
    minWidth: 200,
  },
  {
    colId: 'create_time',
    headerName: '添加时间',
    field: 'create_time',
    valueFormatter: p => (p.value ? formatTimeStamp(p.value) : ''),
    filter: 'agDateColumnFilter',
    filterParams: filterParams,
    filterValueGetter: (params: ValueGetterParams) => {
      return new Date(params.getValue('create_time') * 1000);
    },
    sort: 'desc',
    minWidth: 180,
    initialHide: true,
    cellClass: 'flex justify-center items-center font-mono',
  },
  {
    colId: 'update_time',
    headerName: '最后同步时间',
    field: 'update_time',
    valueFormatter: p => (p.value ? formatTimeStamp(p.value) : ''),
    filter: 'agDateColumnFilter',
    filterParams: filterParams,
    filterValueGetter: (params: ValueGetterParams) => {
      return new Date(params.getValue('update_time') * 1000);
    },
    minWidth: 180,
    cellClass: 'flex justify-center items-center font-mono',
  },
  {
    colId: 'total_count',
    headerName: '消息总数',
    field: 'total_count',
    cellDataType: 'number',
    cellRenderer: 'agAnimateShowChangeCellRenderer',
    filter: 'agNumberColumnFilter',
    cellClass: 'flex justify-center items-center font-mono',
    minWidth: 150,
  },
  {
    colId: 'count',
    headerName: '已加载消息数',
    field: 'count',
    cellDataType: 'number',
    cellRenderer: 'agAnimateShowChangeCellRenderer',
    filter: 'agNumberColumnFilter',
    cellClass: 'flex justify-center items-center font-mono',
    minWidth: 150,
  },
  {
    colId: 'articles',
    headerName: '已加载文章数',
    field: 'articles',
    cellDataType: 'number',
    cellRenderer: 'agAnimateShowChangeCellRenderer',
    filter: 'agNumberColumnFilter',
    cellClass: 'flex justify-center items-center font-mono',
    minWidth: 150,
    initialHide: true,
  },
  {
    colId: 'load_percent',
    headerName: '加载进度',
    valueGetter: params => params.data.count / params.data.total_count,
    cellDataType: 'number',
    cellRenderer: GridLoadProgress,
    filter: 'agNumberColumnFilter',
    minWidth: 200,
  },
  {
    colId: 'completed',
    headerName: '已加载完成',
    field: 'completed',
    valueGetter: p => (
      !!p.data.completed
    ),
    cellDataType: 'boolean',
    filter: 'agSetColumnFilter',
    filterParams: booleanColumnFilterParams,
    cellClass: 'flex justify-center items-center',
    headerClass: 'justify-center',
    minWidth: 150,
  },
  {
    colId: 'action',
    headerName: '操作',
    field: 'fakeid',
    sortable: false,
    filter: false,
    cellRenderer: GridAccountActions,
    cellRendererParams: {
      onSync: (params: ICellRendererParams) => {
        if (!checkLogin()) return;

        isCanceled.value = false;
        loadAccountArticle(params.data)
          .then(() => {
            toast.success('同步完成', `公众号【${params.data.nickname}】的文章已同步完毕`);
          })
          .catch(e => {
            toast.error('同步失败', e.message);
          });
      },
      onStop: (params: ICellRendererParams) => {
        isCanceled.value = true;
        if (timer.value) {
          window.clearTimeout(timer.value);
          timer.value = null;
        }

        syncingRowId.value = null;
        isSyncing.value = false;
      },
      isDeleting: isDeleting,
      isSyncing: isSyncing,
      syncingRowId: syncingRowId,
    },
    cellClass: 'flex justify-center items-center',
    maxWidth: 100,
    pinned: 'right',
  },
]);

const gridOptions: GridOptions = {
  localeText: AG_GRID_LOCALE_CN,
  rowNumbers: true,
  loadingOverlayComponent: GridLoading,
  noRowsOverlayComponent: GridNoRows,
  getRowId: (params: GetRowIdParams) => String(params.data.fakeid),
  sideBar: {
    toolPanels: [
      {
        id: 'columns',
        labelDefault: 'Columns',
        labelKey: 'columns',
        iconKey: 'columns',
        toolPanel: 'agColumnsToolPanel',
        minWidth: 225,
        maxWidth: 225,
        width: 225,
        toolPanelParams: {
          suppressRowGroups: true,
          suppressValues: true,
          suppressPivotMode: true,
        },
      },
    ],
    position: 'right',
  },
  enableCellTextSelection: true,
  tooltipShowDelay: 0,
  tooltipShowMode: 'whenTruncated',
  suppressContextMenu: true,
  defaultColDef: {
    sortable: true,
    filter: true,
    flex: 1,
    enableCellChangeFlash: false,
    suppressHeaderMenuButton: true,
    suppressHeaderContextMenu: true,
    enableValue: true,
    enableRowGroup: true,
  },
  selectionColumnDef: {
    sortable: true,
    width: 80,
    pinned: 'left',
  },
  rowSelection: {
    mode: 'multiRow',
    headerCheckbox: true,
    selectAll: 'filtered',
  },
  theme: themeQuartz.withParams({
    borderColor: '#e5e7eb',
    rowBorder: true,
    columnBorder: true,
    headerFontWeight: 700,
    oddRowBackgroundColor: '#00005506',
    sidePanelBorder: true,
  }),
};

const gridApi = shallowRef<GridApi | null>(null);
async function onGridReady(params: GridReadyEvent) {
  gridApi.value = params.api;

  restoreColumnState();
  await refresh();
  
  // 表格数据加载完成后，应用保存的选中状态
  setTimeout(() => {
    applySavedSelection();
  }, 100); // 短暂延迟确保数据已完全渲染
}

function onColumnStateChange() {
  if (gridApi.value) {
    saveColumnState();
  }
}
function saveColumnState() {
  const state = gridApi.value?.getColumnState();
  localStorage.setItem('agGridColumnState-account', JSON.stringify(state));
}

function restoreColumnState() {
  const stateStr = localStorage.getItem('agGridColumnState-account');
  if (stateStr) {
    const state = JSON.parse(stateStr);
    gridApi.value?.applyColumnState({
      state,
      applyOrder: true,
    });
  }
}

async function refresh() {
  globalRowData = await getAllInfo();
  gridApi.value?.setGridOption('rowData', globalRowData);
}

async function updateRow(fakeid: string) {
  const rowNode = gridApi.value?.getRowNode(fakeid);
  if (rowNode) {
    const info = await getInfoCache(fakeid);
    rowNode.updateData(info);
  }
}

// 当前是否有选中的行
const hasSelectedRows = ref(false);

// 保存选中状态到本地存储
function saveSelectedRows() {
  try {
    const selectedRows = getSelectedRows();
    const selectedFakeIds = selectedRows.map(row => row.fakeid);
    localStorage.setItem('wechat-article-exporter-selected-accounts', JSON.stringify(selectedFakeIds));
    console.log('已保存选中的公众号:', selectedFakeIds.length, '个');
  } catch (error) {
    console.error('保存选中状态失败:', error);
  }
}

// 从本地存储加载选中状态
function loadSelectedRows() {
  try {
    const savedIdsStr = localStorage.getItem('wechat-article-exporter-selected-accounts');
    if (savedIdsStr) {
      const savedFakeIds = JSON.parse(savedIdsStr);
      console.log('已加载选中的公众号ID数量:', savedFakeIds.length);
      return savedFakeIds;
    }
  } catch (error) {
    console.error('加载选中状态失败:', error);
  }
  return [];
}

// 应用保存的选中状态
function applySavedSelection() {
  if (!gridApi.value || globalRowData.length === 0) return;
  
  const savedFakeIds = loadSelectedRows();
  if (savedFakeIds.length === 0) return;
  
  console.log('正在应用保存的选中状态');
  gridApi.value.forEachNode(node => {
    if (savedFakeIds.includes(node.data.fakeid)) {
      node.setSelected(true);
    }
  });
}

function onSelectionChanged(evt: SelectionChangedEvent) {
  hasSelectedRows.value = (evt.selectedNodes?.map(node => node.data) || []).length > 0;
  // 保存选中状态到本地存储
  saveSelectedRows();
}

function getSelectedRows() {
  const rows: Info[] = [];
  gridApi.value?.forEachNodeAfterFilterAndSort(node => {
    if (node.isSelected()) {
      rows.push(node.data);
    }
  });
  return rows;
}

// 删除所选的公众号数据
function deleteSelectedAccounts() {
  const rows = getSelectedRows();
  const ids = rows.map(info => info.fakeid);
  modal.open(ConfirmModal, {
    title: '确定要删除所选公众号的数据吗？',
    description: '删除之后，该公众号的所有数据(包括已下载的文章和留言等)都将被清空。',
    async onConfirm() {
      try {
        isDeleting.value = true;
        await deleteAccountData(ids);
        // 通知 Credentials 面板这些公众号已被移除
        ids.forEach(fakeid => accountEventBus.emit({ type: 'account-removed', fakeid }));
      } finally {
        isDeleting.value = false;
        await refresh();
      }
    },
  });
}

onMounted(() => {
  // 加载保存的自动同步设置
  loadAutoSyncSettings();
  
  // 组件挂载时，如果启用了自动同步，等待表格数据加载完成后再检查选中状态
  if (isAutoSyncEnabled.value) {
    // 延迟检查，确保表格已加载且选中状态已恢复
    setTimeout(() => {
      const rows = getSelectedRows();
      if (rows.length > 0) {
        startAutoSync();
        console.log('自动同步已启动，选中公众号数量:', rows.length);
      } else {
        // 如果没有选中的公众号，关闭自动同步
        isAutoSyncEnabled.value = false;
        saveAutoSyncSettings();
        console.log('未选择公众号，自动同步已关闭');
      }
    }, 1500); // 稍长延迟，确保选中状态已应用
  }
});

onBeforeUnmount(() => {
  stopAccountEvent();
  // 组件卸载时，确保停止定时任务
  stopAutoSync();
});

// 导入公众号
const fileRef = ref<HTMLInputElement | null>(null);
const importBtnLoading = ref(false);
function importAccount() {
  fileRef.value!.click();
}
async function handleFileChange(evt: Event) {
  const files = (evt.target as HTMLInputElement).files;
  if (files && files.length > 0) {
    const file = files[0];

    try {
      importBtnLoading.value = true;

      // 使用 FileReader 读取文件内容
      const fileContent = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = e => {
          if (typeof e.target?.result === 'string') {
            resolve(e.target.result);
          } else {
            reject(new Error('读取文件失败'));
          }
        };
        reader.onerror = () => reject(new Error('读取文件失败'));
        reader.readAsText(file, 'UTF-8');
      });

      // 解析 JSON
      const jsonData = JSON.parse(fileContent);
      if (jsonData.usefor !== 'wechat-article-exporter') {
        // 文件格式不正确
        toast.error('导入公众号失败', '导入文件格式不正确，请选择该网站导出的文件进行导入。');
        return;
      }
      const infos = jsonData.accounts;
      if (!infos || infos.length <= 0) {
        // 文件格式不正确
        toast.error('导入公众号失败', '导入文件格式不正确，请选择该网站导出的文件进行导入。');
        return;
      }

      await importInfos(infos);
      await refresh();
    } catch (error) {
      console.error('导入公众号时 JSON 解析失败:', error);
      toast.error('导入公众号', (error as Error).message);
    } finally {
      importBtnLoading.value = false;
    }
  }
}

// 导出公众号
const exportBtnLoading = ref(false);
function exportAccount() {
  exportBtnLoading.value = true;
  try {
    const rows = getSelectedRows();
    const data: AccountManifest = {
      version: '1.0',
      usefor: 'wechat-article-exporter',
      accounts: rows,
    };
    exportAccountJsonFile(data, '公众号');
    toast.success('导出公众号', `成功导出了 ${rows.length} 个公众号`);
  } finally {
    exportBtnLoading.value = false;
  }
}
</script>

<template>
  <div class="h-full">
    <Teleport defer to="#title">
      <h1 class="text-[28px] leading-[34px] text-slate-12 dark:text-slate-50 font-bold">公众号管理</h1>
    </Teleport>

    <div class="flex flex-col h-full divide-y divide-gray-200">
      <!-- 顶部操作区 -->
      <header class="flex items-center flex-wrap gap-3 px-3 py-3">
        <UButton icon="i-lucide:user-plus" color="blue" :disabled="isDeleting || addBtnLoading" @click="addAccount">
          {{ addBtnLoading ? '添加中...' : '添加' }}
        </UButton>
        <UButton icon="i-lucide:arrow-down-to-line" color="blue" :loading="importBtnLoading" @click="importAccount">
          批量导入
          <input ref="fileRef" type="file" accept=".json" class="hidden" @change="handleFileChange" />
        </UButton>
        <UButton
          icon="i-lucide:arrow-up-from-line"
          color="blue"
          :loading="exportBtnLoading"
          :disabled="!hasSelectedRows"
          @click="exportAccount"
        >
          批量导出
        </UButton>
        <UButton
          color="rose"
          icon="i-lucide:user-minus"
          class="disabled:opacity-35"
          :loading="isDeleting"
          :disabled="!hasSelectedRows"
          @click="deleteSelectedAccounts"
          >删除</UButton
        >
        <UButton
          color="black"
          icon="i-heroicons:arrow-path-rounded-square-20-solid"
          class="disabled:opacity-35"
          :loading="isSyncing"
          :disabled="isDeleting || !hasSelectedRows"
          @click="loadSelectedAccountArticle"
          >同步</UButton
        >
        
        <!-- 自动同步控制 -->
        <div class="flex items-center gap-2 ml-auto">
          <label class="text-sm font-medium text-gray-700">自动同步：</label>
          <label class="inline-flex items-center cursor-pointer">
            <input 
              type="checkbox" 
              class="sr-only peer" 
              v-model="isAutoSyncEnabled"
              @change="handleAutoSyncToggle"
            />
            <div class="relative w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
          </label>
          <div class="flex items-center gap-1" v-if="isAutoSyncEnabled">
            <input 
              type="number" 
              min="1" 
              max="1440" 
              class="w-16 px-2 py-1 text-sm border border-gray-300 rounded" 
              v-model.number="autoSyncInterval"
              @change="handleIntervalChange"
            />
            <span class="text-sm text-gray-700">分钟</span>
          </div>
        </div>
      </header>

      <!-- 数据表格 -->
      <ag-grid-vue
        style="width: 100%; height: 100%"
        :rowData="globalRowData"
        :columnDefs="columnDefs"
        :gridOptions="gridOptions"
        @grid-ready="onGridReady"
        @selection-changed="onSelectionChanged"
        @column-moved="onColumnStateChange"
        @column-visible="onColumnStateChange"
        @column-pinned="onColumnStateChange"
        @column-resized="onColumnStateChange"
      ></ag-grid-vue>
    </div>

    <!-- 添加公众号弹框 -->
    <GlobalSearchAccount ref="searchAccountRef" @select:account="onSelectAccount" />
  </div>
</template>
