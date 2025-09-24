// Tipos para componentes React
export interface BaseComponentProps {
  className?: string;
  children?: React.ReactNode;
}

export interface LoadingProps extends BaseComponentProps {
  message?: string;
  size?: 'small' | 'medium' | 'large';
}

export interface ErrorProps extends BaseComponentProps {
  message: string;
  onRetry?: () => void;
  retryable?: boolean;
  onClear?: () => void;
}

// Tipos para formularios
export interface FormFieldProps {
  name: string;
  label?: string;
  placeholder?: string;
  required?: boolean;
  disabled?: boolean;
  error?: string;
}

export interface SelectOption {
  value: string | number;
  label: string;
}

export interface SelectFieldProps extends FormFieldProps {
  options: SelectOption[];
  multiple?: boolean;
  value?: string | number | (string | number)[];
  onChange?: (value: string | number | (string | number)[]) => void;
}

export interface InputFieldProps extends FormFieldProps {
  type?: 'text' | 'email' | 'password' | 'number' | 'tel' | 'url';
  value?: string | number;
  onChange?: (value: string) => void;
  min?: number;
  max?: number;
  step?: number;
}

// Tipos para filtros
export interface FilterState {
  page: number;
  limit: number;
  sort: string;
  order: 'asc' | 'desc';
  search: string;
  [key: string]: any;
}

export interface FilterActions {
  setFilters: (filters: Partial<FilterState>) => void;
  resetFilters: () => void;
  toggleAdvanced: () => void;
}

// Tipos para tema
export interface ThemeContextType {
  isDarkMode: boolean;
  toggleTheme: () => void;
}

// Tipos para navegación
export interface NavItem {
  path: string;
  label: string;
  icon?: React.ComponentType;
  requiresAuth?: boolean;
}

// Tipos para modales
export interface ModalProps extends BaseComponentProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  size?: 'small' | 'medium' | 'large' | 'fullscreen';
  closable?: boolean;
}

// Tipos para tablas y listas
export interface TableColumn<T = any> {
  key: keyof T | string;
  title: string;
  render?: (value: any, record: T) => React.ReactNode;
  sortable?: boolean;
  width?: string | number;
  align?: 'left' | 'center' | 'right';
}

export interface TableProps<T = any> extends BaseComponentProps {
  columns: TableColumn<T>[];
  data: T[];
  loading?: boolean;
  pagination?: {
    current: number;
    total: number;
    pageSize: number;
    onChange: (page: number) => void;
  };
  onSort?: (key: string, order: 'asc' | 'desc') => void;
  rowKey?: keyof T | ((record: T) => string);
  onRowClick?: (record: T) => void;
}

// Tipos para ratings
export interface RatingProps extends BaseComponentProps {
  value: number;
  max?: number;
  size?: 'small' | 'medium' | 'large';
  interactive?: boolean;
  showValue?: boolean;
  onChange?: (value: number) => void;
  precision?: number;
}

// Tipos para estadísticas
export interface StatCardProps extends BaseComponentProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon?: React.ComponentType;
  trend?: {
    value: number;
    label: string;
    direction: 'up' | 'down' | 'neutral';
  };
  loading?: boolean;
}

// Tipos para badges y tags
export interface BadgeProps extends BaseComponentProps {
  variant?: 'primary' | 'secondary' | 'success' | 'warning' | 'error' | 'info';
  size?: 'small' | 'medium' | 'large';
  rounded?: boolean;
}

export interface TagProps extends BadgeProps {
  closable?: boolean;
  onClose?: () => void;
}

// Tipos para botones
export interface ButtonProps extends BaseComponentProps {
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger';
  size?: 'small' | 'medium' | 'large';
  disabled?: boolean;
  loading?: boolean;
  icon?: React.ComponentType;
  iconPosition?: 'left' | 'right';
  onClick?: () => void;
  type?: 'button' | 'submit' | 'reset';
  href?: string;
  target?: '_blank' | '_self' | '_parent' | '_top';
}

// Tipos para cards
export interface CardProps extends BaseComponentProps {
  title?: string;
  subtitle?: string;
  headerActions?: React.ReactNode;
  footer?: React.ReactNode;
  hoverable?: boolean;
  bordered?: boolean;
  shadow?: 'none' | 'small' | 'medium' | 'large';
  padding?: 'none' | 'small' | 'medium' | 'large';
}

// Tipos para layouts
export interface LayoutProps extends BaseComponentProps {
  header?: React.ReactNode;
  sidebar?: React.ReactNode;
  footer?: React.ReactNode;
  sidebarCollapsed?: boolean;
  onSidebarToggle?: () => void;
}

export interface ContainerProps extends BaseComponentProps {
  maxWidth?: 'sm' | 'md' | 'lg' | 'xl' | 'full';
  padding?: 'none' | 'small' | 'medium' | 'large';
  centered?: boolean;
}

// Tipos para hooks personalizados
export interface UseAsyncState<T> {
  data: T | null;
  loading: boolean;
  error: Error | null;
  execute: (...args: any[]) => Promise<T>;
  reset: () => void;
}

export interface UsePaginationState {
  page: number;
  limit: number;
  total: number;
  pages: number;
  hasNext: boolean;
  hasPrev: boolean;
  setPage: (page: number) => void;
  setLimit: (limit: number) => void;
  reset: () => void;
}

// Tipos para API responses
export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  message?: string;
  error?: string;
  pagination?: {
    page: number;
    pages: number;
    total: number;
    limit: number;
  };
}

export interface ApiError {
  message: string;
  code?: string;
  statusCode?: number;
  details?: any;
}

// Tipos para validación
export interface ValidationRule {
  required?: boolean;
  min?: number;
  max?: number;
  pattern?: RegExp;
  custom?: (value: any) => boolean | string;
  message?: string;
}

export interface ValidationResult {
  isValid: boolean;
  errors: Record<string, string>;
}

// Tipos para internacionalización
export interface TranslationFunction {
  (key: string, options?: Record<string, any>): string;
}

export interface I18nContextType {
  t: TranslationFunction;
  language: string;
  changeLanguage: (lang: string) => void;
  languages: Array<{
    code: string;
    name: string;
    flag?: string;
  }>;
}

// Tipos para PWA
export interface PWAInstallPrompt {
  prompt: () => Promise<void>;
  userChoice: Promise<{
    outcome: 'accepted' | 'dismissed';
    platform: string;
  }>;
}

export interface PWAActions {
  canInstall: boolean;
  install: () => Promise<void>;
  isInstalled: boolean;
  isOffline: boolean;
}

// Tipos para notificaciones
export interface NotificationItem {
  id: string;
  type: 'info' | 'success' | 'warning' | 'error';
  title: string;
  message?: string;
  duration?: number;
  closable?: boolean;
  action?: {
    label: string;
    onClick: () => void;
  };
}

export interface NotificationContextType {
  notifications: NotificationItem[];
  addNotification: (notification: Omit<NotificationItem, 'id'>) => void;
  removeNotification: (id: string) => void;
  clearNotifications: () => void;
}

// Tipos para búsqueda
export interface SearchFilters {
  query: string;
  type?: string;
  category?: string;
  dateRange?: {
    from: Date;
    to: Date;
  };
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

export interface SearchResult<T = any> {
  items: T[];
  total: number;
  facets?: Record<string, any>;
  suggestions?: string[];
}

// Tipos para drag and drop
export interface DragItem {
  id: string;
  type: string;
  data?: any;
}

export interface DropResult {
  source: {
    droppableId: string;
    index: number;
  };
  destination?: {
    droppableId: string;
    index: number;
  };
  draggableId: string;
}

// Tipos para virtualización
export interface VirtualizedListProps<T = any> extends BaseComponentProps {
  items: T[];
  itemHeight: number;
  containerHeight: number;
  renderItem: (item: T, index: number) => React.ReactNode;
  overscan?: number;
}

// Tipos para animaciones
export interface AnimationProps {
  duration?: number;
  delay?: number;
  easing?: string;
  direction?: 'normal' | 'reverse' | 'alternate' | 'alternate-reverse';
  fillMode?: 'none' | 'forwards' | 'backwards' | 'both';
  iterations?: number | 'infinite';
}

// Declaración global para React
declare global {
  namespace React {
    interface HTMLAttributes<T> extends AriaAttributes, DOMAttributes<T> {
      // Extender con atributos personalizados si es necesario
    }
  }
}