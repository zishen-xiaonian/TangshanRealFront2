const chartPatterns = {
  sevenDays: {
    userTypes: {
      coal: [118, 154, 206, 248, 232, 286, 254],
      important: [34, 48, 66, 82, 74, 96, 88],
    },
    frequentWarnings: {
      extreme: [12, 18, 22, 31, 26, 38, 29],
      exceptional: [16, 23, 30, 38, 32, 46, 39],
      severe: [20, 28, 36, 45, 38, 54, 47],
      major: [24, 34, 43, 52, 46, 63, 55],
      medium: [31, 42, 52, 61, 56, 72, 66],
      mild: [42, 55, 68, 78, 71, 91, 83],
    },
    outageImpact: {
      veryHigh: [25, 34, 42, 51, 45, 59, 53],
      high: [38, 49, 62, 75, 68, 84, 77],
      medium: [72, 88, 112, 136, 124, 151, 139],
      low: [46, 57, 71, 82, 76, 94, 88],
    },
  },
  thirtyDays: {
    userTypes: {
      coal: [92, 118, 146, 154, 138, 158, 154, 156, 218, 252, 210, 236, 174, 222, 142],
      important: [28, 34, 48, 66, 74, 86, 92, 96, 112, 178, 132, 164, 86, 146, 78],
    },
    frequentWarnings: {
      extreme: [11, 17, 24, 28, 22, 31, 19, 27, 35, 54, 25, 38, 22, 30, 16],
      exceptional: [18, 24, 31, 37, 30, 42, 26, 38, 47, 66, 36, 52, 31, 40, 24],
      severe: [22, 29, 38, 45, 36, 49, 32, 44, 57, 72, 43, 61, 38, 48, 29],
      major: [27, 36, 44, 52, 42, 58, 37, 51, 64, 79, 48, 68, 43, 55, 34],
      medium: [34, 45, 54, 64, 51, 69, 46, 61, 76, 88, 59, 82, 55, 66, 41],
      mild: [40, 51, 62, 73, 60, 82, 55, 72, 91, 103, 68, 96, 64, 78, 49],
    },
    outageImpact: {
      veryHigh: [18, 24, 31, 37, 29, 42, 35, 44, 51, 62, 49, 58, 43, 52, 36],
      high: [31, 42, 55, 63, 49, 71, 58, 76, 86, 98, 77, 91, 69, 82, 58],
      medium: [54, 68, 86, 94, 82, 105, 91, 112, 124, 139, 116, 131, 102, 118, 91],
      low: [38, 47, 58, 66, 54, 74, 62, 81, 89, 104, 85, 96, 76, 88, 69],
    },
  },
  history: {
    userTypes: {
      coal: [138, 164, 181, 205, 228, 249, 271, 296, 318, 305, 337, 362],
      important: [52, 61, 69, 78, 86, 95, 104, 116, 127, 121, 136, 148],
    },
    frequentWarnings: {
      extreme: [18, 22, 25, 29, 33, 37, 42, 48, 53, 49, 57, 62],
      exceptional: [24, 28, 32, 37, 42, 47, 53, 59, 66, 61, 70, 77],
      severe: [29, 34, 39, 44, 50, 56, 63, 70, 78, 72, 82, 90],
      major: [36, 41, 47, 53, 60, 67, 75, 83, 92, 86, 97, 106],
      medium: [43, 49, 56, 63, 71, 79, 88, 97, 107, 100, 112, 123],
      mild: [51, 58, 66, 74, 83, 92, 102, 112, 123, 115, 128, 140],
    },
    outageImpact: {
      veryHigh: [28, 32, 37, 42, 47, 53, 59, 66, 73, 68, 77, 85],
      high: [46, 52, 59, 67, 75, 84, 94, 104, 115, 108, 121, 133],
      medium: [82, 91, 102, 114, 127, 141, 156, 172, 189, 178, 198, 217],
      low: [55, 62, 70, 79, 88, 98, 109, 120, 132, 124, 138, 151],
    },
  },
}

const parseEndDate = (value) => {
  const matched = String(value || '').match(/^(\d{4})-(\d{2})-(\d{2})/)
  if (matched) {
    return new Date(Number(matched[1]), Number(matched[2]) - 1, Number(matched[3]))
  }
  return new Date()
}

const addDays = (date, amount) => {
  const result = new Date(date)
  result.setDate(result.getDate() + amount)
  return result
}

const formatDay = (date) => String(date.getDate()).padStart(2, '0')

const buildLabels = (rangeType, endDate) => {
  const end = parseEndDate(endDate)

  if (rangeType === 'sevenDays') {
    return Array.from({ length: 7 }, (_, index) => formatDay(addDays(end, index - 6)))
  }

  if (rangeType === 'history') {
    return Array.from({ length: 12 }, (_, index) => {
      const date = new Date(end.getFullYear(), end.getMonth() - 11 + index, 1)
      return `${String(date.getMonth() + 1).padStart(2, '0')}月`
    })
  }

  return Array.from({ length: 15 }, (_, index) => formatDay(addDays(end, index * 2 - 28)))
}

const toSeries = (items) => items.map(([key, name, color, values]) => ({ key, name, color, values }))

export const createMockOutageUserAnalysis = (rangeType = 'thirtyDays', endDate = '') => {
  const resolvedRange = chartPatterns[rangeType] ? rangeType : 'thirtyDays'
  const pattern = chartPatterns[resolvedRange]
  const labels = buildLabels(resolvedRange, endDate)

  return {
    userTypes: {
      labels,
      series: toSeries([
        ['coal', '煤改电用户', '#1eb1bf', pattern.userTypes.coal],
        ['important', '重要用户', '#e6aa17', pattern.userTypes.important],
      ]),
    },
    frequentWarnings: {
      labels,
      series: toSeries([
        ['extreme', '极度风险', '#8f1d2c', pattern.frequentWarnings.extreme],
        ['exceptional', '特大风险', '#bd2534', pattern.frequentWarnings.exceptional],
        ['severe', '重大风险', '#df3740', pattern.frequentWarnings.severe],
        ['major', '较大风险', '#f06f2b', pattern.frequentWarnings.major],
        ['medium', '中度风险', '#efad2b', pattern.frequentWarnings.medium],
        ['mild', '轻度风险', '#43cba0', pattern.frequentWarnings.mild],
      ]),
    },
    outageImpact: {
      labels,
      series: toSeries([
        ['veryHigh', '用户数极大', '#e84545', pattern.outageImpact.veryHigh],
        ['high', '用户数较大', '#ef941e', pattern.outageImpact.high],
        ['medium', '用户数中度', '#14adb7', pattern.outageImpact.medium],
        ['low', '用户数轻度', '#4bc6a5', pattern.outageImpact.low],
      ]),
    },
  }
}
