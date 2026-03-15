/**
 * 组件类型定义 - 提供类型安全的组件实例类型
 */

/**
 * 基础组件实例类型
 * 使用交集类型来扩展 Component 实例，添加 triggerEvent 等方法
 */
export type SafeComponentInstance = WechatMiniprogram.Component.TrivialInstance & {
  /**
   * 触发组件事件
   * @param eventName 事件名称
   * @param detail 事件详细信息
   * @param options 事件选项
   */
  triggerEvent: (
    eventName: string,
    detail?: any,
    options?: {
      bubbles?: boolean;
      composed?: boolean;
      capturePhase?: boolean;
    }
  ) => void;
};

/**
 * 组件构造器类型 - 确保 Component 函数的返回值具有正确的类型
 */
export type ComponentConstructor<
  TData extends WechatMiniprogram.Component.DataOption,
  TProperties extends WechatMiniprogram.Component.PropertyOption,
  TMethods extends WechatMiniprogram.Component.MethodOption,
> = (options: {
  properties?: TProperties;
  data?: TData;
  methods?: TMethods;
  [key: string]: any;
}) => string;

/**
 * 获取组件实例类型 - 从 Component options 推断实例类型
 */
export type GetComponentInstance<
  T extends {
    properties?: Record<string, any>;
    data?: Record<string, any>;
    methods?: Record<string, any>;
  },
> = WechatMiniprogram.Component.Instance<
  T extends { data: infer D } ? (D extends WechatMiniprogram.Component.DataOption ? D : {}) : {},
  T extends { properties: infer P }
    ? P extends WechatMiniprogram.Component.PropertyOption
      ? P
      : {}
    : {},
  T extends { methods: infer M }
    ? M extends WechatMiniprogram.Component.MethodOption
      ? M
      : {}
    : {}
>;
