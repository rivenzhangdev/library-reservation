module.exports = {
  extends: [
    'stylelint-config-standard-scss',
  ],
  plugins: ['stylelint-order'],
  overrides: [
    {
      files: ['**/*.scss'],
      customSyntax: 'postcss-scss',
    },
    {
      files: ['**/*.css'],
      customSyntax: 'postcss',
    },
    {
      files: ['**/*.wxss'],
      customSyntax: 'postcss-less',
    },
  ],
  rules: {
    // 允许 @use 和 @import（小程序必需）
    'at-rule-no-unknown': null,
    'scss/at-rule-no-unknown': true,
    
    // 命名约定
    'selector-class-pattern': null,
    'custom-property-pattern': null,
    
    // 颜色相关
    'color-function-notation': null,
    'alpha-value-notation': null,
    'color-function-alias-notation': null,
    
    // 字体相关
    'font-family-no-missing-generic-family-keyword': null,
    
    // 单位相关 - 支持小程序 rpx 单位
    'unit-no-unknown': [true, { ignoreUnits: ['rpx'] }],
    
    // 小程序特定规则 - 支持小程序内置标签
    'no-descending-specificity': null,
    'property-no-vendor-prefix': null,
    'selector-type-no-unknown': [true, { ignoreTypes: ['page', 'swiper', 'swiper-item', 'scroll-view', 'image', 'text', 'view', 'block'] }],
    
    // 注释样式
    'comment-whitespace-inside': null,
    
    // @use 规则扩展名检查禁用（小程序不需要）
    'scss/load-partial-extension': null,
    
    // 空行规则
    'rule-empty-line-before': null,
    
    // ========== CSS 属性顺序规则 ==========
    // 启用属性顺序检查（按字母顺序排列）
    'order/properties-alphabetical-order': true,
    
    // 或者使用自定义顺序组（更常用）
    // 'order/order': [
    //   'dollar-variables',
    //   'custom-properties',
    //   'declarations',
    //   'at-rules',
    //   'rules'
    // ],
    // 'order/properties': [
    //   // 定位属性
    //   'position',
    //   'top', 'right', 'bottom', 'left',
    //   'z-index',
    //   // 盒模型
    //   'display',
    //   'width', 'height',
    //   'margin', 'padding',
    //   'border',
    //   // 布局
    //   'flex', 'grid',
    //   // 其他
    //   'overflow',
    //   'opacity',
    //   'visibility'
    // ],
  },
};
