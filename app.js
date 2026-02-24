const { createApp, computed, nextTick, ref, watch } = Vue;

createApp({
  setup() {
    const minTasksRequired = 1;
    const currentStep = ref(1);
    const stepThreePanel = ref(null);
    const notice = ref({ show: false, text: "", type: "info" });
    let noticeTimer = null;
    const taskPlaceholderSamples = [
      "例如：技術開發",
      "例如：學習",
      "例如：客戶訪談",
      "例如：資料處理",
      "例如：後端開發",
      "例如：前端開發",
      "例如：資料庫管理",
      "例如：系統分析",
      "例如：整理帳務",
      "例如：開票",
      "例如：財務平台操作",
      "例如：發薪",
      "例如：出納",
      "例如：寫計劃書",
      "例如：程式維運",
      "例如：MIS",
      "例如：品質管制"
    ];

    const pickRandomPlaceholder = () => {
      const randomIndex = Math.floor(Math.random() * taskPlaceholderSamples.length);
      return taskPlaceholderSamples[randomIndex];
    };

    const tasks = ref([
      {
        id: crypto.randomUUID(),
        name: "",
        placeholder: pickRandomPlaceholder(),
        scores: {
          goodAt: null,
          love: null,
          meaning: null,
          paid: null
        }
      }
    ]);

    let radarChart = null;
    let barChart = null;
    const chartLabels = ["熱情（Passion）", "使命（Mission）", "志向（Calling）", "專業（Mastery）"];
    const feedbackConfig = window.FEEDBACK_CONFIG || {};

    const namedTasks = computed(() =>
      tasks.value.filter((task) => task.name.trim().length > 0)
    );

    const hasMinimumTasks = computed(() => namedTasks.value.length >= minTasksRequired);

    const isFilledScore = (value) => {
      if (value === null || value === undefined || value === "") {
        return false;
      }
      const num = Number(value);
      return !Number.isNaN(num);
    };

    const hasCompleteScores = computed(() =>
      namedTasks.value.every((task) => {
        const { goodAt, love, meaning, paid } = task.scores;
        return [goodAt, love, meaning, paid].every(isFilledScore);
      })
    );

    const progressPercent = computed(() => {
      if (currentStep.value === 1) return 25;
      if (currentStep.value === 2) return 50;
      if (currentStep.value === 3) return 75;
      return 100;
    });

    const ratingOptions = [
      { value: 1, label: "1" },
      { value: 2, label: "2" },
      { value: 3, label: "3" },
      { value: 4, label: "4" },
      { value: 5, label: "5" }
    ];

    const safeScore = (value) => {
      if (!isFilledScore(value)) return null;
      const num = Number(value);
      return Math.min(5, Math.max(1, num));
    };

    const sanitizedTasks = computed(() =>
      tasks.value.map((task) => ({
        ...task,
        scores: {
          goodAt: safeScore(task.scores.goodAt),
          love: safeScore(task.scores.love),
          meaning: safeScore(task.scores.meaning),
          paid: safeScore(task.scores.paid)
        }
      }))
    );

    const totals = computed(() => {
      return sanitizedTasks.value.reduce(
        (acc, task) => {
          const G = task.scores.goodAt ?? 0;
          const L = task.scores.love ?? 0;
          const M = task.scores.meaning ?? 0;
          const P = task.scores.paid ?? 0;

          acc.passion += L + G;
          acc.mission += L + M;
          acc.calling += M + P;
          acc.mastery += G + P;
          return acc;
        },
        { passion: 0, mission: 0, calling: 0, mastery: 0 }
      );
    });

    const normalizedTotals = computed(() => {
      const taskCount = Math.max(namedTasks.value.length, 1);
      const maxPerDimension = taskCount * 10;

      return {
        passion: Number(((totals.value.passion / maxPerDimension) * 100).toFixed(1)),
        mission: Number(((totals.value.mission / maxPerDimension) * 100).toFixed(1)),
        calling: Number(((totals.value.calling / maxPerDimension) * 100).toFixed(1)),
        mastery: Number(((totals.value.mastery / maxPerDimension) * 100).toFixed(1))
      };
    });

    const normalizedRadarData = computed(() => {
      return [
        normalizedTotals.value.passion,
        normalizedTotals.value.mission,
        normalizedTotals.value.calling,
        normalizedTotals.value.mastery
      ];
    });

    const rawTaskRows = computed(() =>
      tasks.value.map((task, index) => ({
        index: index + 1,
        name: task.name?.trim() || "",
        goodAt: task.scores.goodAt ?? "-",
        love: task.scores.love ?? "-",
        meaning: task.scores.meaning ?? "-",
        paid: task.scores.paid ?? "-"
      }))
    );

    const rawTableShareText = computed(() => {
      const header = ["#", "任務", "擅長程度", "喜歡程度", "成就感", "薪資報酬"].join("\t");
      const rows = rawTaskRows.value.map((row) =>
        [
          row.index,
          row.name || "—",
          row.goodAt,
          row.love,
          row.meaning,
          row.paid
        ].join("\t")
      );

      return ["【創準年度職涯回顧自評｜原始填答表】", header, ...rows].join("\n");
    });

    const balance = computed(() => {
      const config = feedbackConfig;

      const values = [
        normalizedTotals.value.passion,
        normalizedTotals.value.mission,
        normalizedTotals.value.calling,
        normalizedTotals.value.mastery
      ];

      const max = Math.max(...values);
      const min = Math.min(...values);
      const avg = values.reduce((sum, value) => sum + value, 0) / values.length;
      const gapRatio = avg > 0 ? (max - min) / avg : 0;
      const gapPercentDisplay = max > 0 ? ((max - min) / max) * 100 : 0;
      const energyRatio = avg / 100;

      const entries = [
        { key: "passion", label: "Passion（熱情）", value: normalizedTotals.value.passion },
        { key: "mission", label: "Mission（使命）", value: normalizedTotals.value.mission },
        { key: "calling", label: "Calling（志向）", value: normalizedTotals.value.calling },
        { key: "mastery", label: "Mastery（專業）", value: normalizedTotals.value.mastery }
      ];

      const sorted = [...entries].sort((a, b) => b.value - a.value);
      const top = sorted[0];
      const second = sorted[1];
      const dominanceRatio = avg > 0 ? (top.value - second.value) / avg : 0;

      let energy = config.energyLevels?.low;
      if (energyRatio >= 0.7) {
        energy = config.energyLevels?.high;
      } else if (energyRatio >= 0.4) {
        energy = config.energyLevels?.mid;
      }
      energy =
        energy ||
        ({ label: "未設定", interpretation: "未設定", risk: "未設定", suggestion: "未設定" });

      let balanceLevel = config.balanceLevels?.high;
      if (gapRatio > 0.25) {
        balanceLevel = config.balanceLevels?.significant;
      } else if (gapRatio > 0.1) {
        balanceLevel = config.balanceLevels?.mild;
      }
      balanceLevel =
        balanceLevel ||
        ({ label: "未設定", description: "未設定", risk: "未設定" });

      let typeLabel = "綜合分布";
      let typeTrait = "多軸混合";
      let typeRisk = "可持續觀察";
      let typeSuggestion = "持續追蹤並微調弱軸";

      const isFullBalanced = gapRatio <= 0.1 && energyRatio >= 0.7;
      const isAllLowBalanced = gapRatio <= 0.1 && energyRatio < 0.4;

      if (isFullBalanced) {
        const special = config.specialTypes?.fullBalanced;
        if (special) {
          typeLabel = special.label;
          typeTrait = special.trait;
          typeRisk = "低";
          typeSuggestion = special.suggestion;
        }
      } else if (isAllLowBalanced) {
        const special = config.specialTypes?.allLowBalanced;
        if (special) {
          typeLabel = special.label;
          typeTrait = special.trait;
          typeRisk = "中";
          typeSuggestion = special.suggestion;
        }
      } else if (dominanceRatio >= (config.dominanceThreshold ?? 0.1)) {
        const dominance = config.dominanceTypes?.[top.key];
        if (dominance) {
          typeLabel = dominance.label;
          typeTrait = dominance.trait;
          typeRisk = dominance.risk;
          typeSuggestion = dominance.suggestion;
        }
      } else {
        const pairKey = [top.key, second.key].sort().join("_");
        const pair = config.pairTypes?.[pairKey];
        if (pair) {
          typeLabel = pair.label;
          typeTrait = pair.trait;
          typeRisk = pair.risk;
          typeSuggestion = pair.suggestion;
        }
      }

      return {
        averageScore: Number(avg.toFixed(1)),
        averageLevel: energy.label,
        averageInterpretation: energy.interpretation,
        energySuggestion: energy.suggestion,
        balanceLabel: balanceLevel.label,
        balanceDescription: balanceLevel.description,
        typeLabel,
        typeTrait,
        risk: typeRisk || energy.risk,
        suggestion: typeSuggestion || energy.suggestion,
        gapPercent: Number(gapPercentDisplay.toFixed(1)),
        message: top ? "" : config.emptyMessage || "請先新增並評分任務。"
      };
    });

    const buildCharts = () => {
      const radarCanvas = document.getElementById("radarChart");
      const barCanvas = document.getElementById("barChart");

      if (radarChart && radarCanvas && radarChart.canvas !== radarCanvas) {
        radarChart.destroy();
        radarChart = null;
      }

      if (barChart && barCanvas && barChart.canvas !== barCanvas) {
        barChart.destroy();
        barChart = null;
      }

      if (radarCanvas && !radarChart) {
        radarChart = new Chart(radarCanvas, {
          type: "radar",
          data: {
            labels: chartLabels,
            datasets: [
              {
                label: "Ikigai 四軸比例分布（%）",
                data: normalizedRadarData.value,
                borderColor: "#2563eb",
                backgroundColor: "rgba(37, 99, 235, 0.2)",
                pointBackgroundColor: "#1d4ed8"
              }
            ]
          },
          options: {
            responsive: true,
            scales: {
              r: {
                min: 0,
                max: 100,
                ticks: {
                  stepSize: 20
                }
              }
            }
          }
        });
      }

      if (barCanvas && !barChart) {
        barChart = new Chart(barCanvas, {
          type: "bar",
          data: {
            labels: chartLabels,
            datasets: [
              {
                label: "Ikigai 四軸比例分布（%）",
                data: normalizedRadarData.value,
                backgroundColor: [
                  "rgba(59, 130, 246, 0.7)",
                  "rgba(16, 185, 129, 0.7)",
                  "rgba(245, 158, 11, 0.7)",
                  "rgba(239, 68, 68, 0.7)"
                ],
                borderColor: ["#3b82f6", "#10b981", "#f59e0b", "#ef4444"],
                borderWidth: 1
              }
            ]
          },
          options: {
            responsive: true,
            scales: {
              y: {
                min: 0,
                max: 100,
                ticks: {
                  stepSize: 20
                }
              }
            }
          }
        });
      }
    };

    const destroyCharts = () => {
      if (radarChart) {
        radarChart.destroy();
        radarChart = null;
      }

      if (barChart) {
        barChart.destroy();
        barChart = null;
      }
    };

    const syncCharts = (data) => {
      if (radarChart) {
        radarChart.data.datasets[0].data = data;
        radarChart.update();
      }

      if (barChart) {
        barChart.data.datasets[0].data = data;
        barChart.update();
      }
    };

    const showNotice = (text, type = "info") => {
      notice.value = { show: true, text, type };
      if (noticeTimer) {
        clearTimeout(noticeTimer);
      }
      noticeTimer = setTimeout(() => {
        notice.value = { show: false, text: "", type: "info" };
      }, 2200);
    };

    const shareStepThreeScreenshot = async () => {
      if (!stepThreePanel.value) {
        showNotice("找不到第 3 頁內容，請稍後再試。", "error");
        return;
      }

      if (typeof window.html2canvas !== "function") {
        showNotice("截圖工具尚未載入，請重新整理後再試。", "error");
        return;
      }

      try {
        const canvas = await window.html2canvas(stepThreePanel.value, {
          backgroundColor: "#f7f8fb",
          scale: Math.min(2, window.devicePixelRatio || 1),
          useCORS: true
        });

        const blob = await new Promise((resolve) => {
          canvas.toBlob(resolve, "image/png");
        });

        if (!blob) {
          showNotice("截圖失敗，請稍後再試。", "error");
          return;
        }

        const file = new File([blob], `ikigai-step3-${Date.now()}.png`, { type: "image/png" });

        if (navigator.share && (!navigator.canShare || navigator.canShare({ files: [file] }))) {
          await navigator.share({
            title: "創準年度職涯回顧自評｜結果截圖",
            text: "這是我的 Ikigai 四軸結果。",
            files: [file]
          });
          showNotice("已開啟分享面板。", "success");
          return;
        }

        const url = URL.createObjectURL(blob);
        const anchor = document.createElement("a");
        anchor.href = url;
        anchor.download = file.name;
        document.body.appendChild(anchor);
        anchor.click();
        anchor.remove();
        URL.revokeObjectURL(url);
        showNotice("此裝置不支援直接分享，已改為下載截圖檔。", "info");
      } catch (error) {
        if (error?.name !== "AbortError") {
          showNotice("截圖分享失敗，請稍後再試。", "error");
        }
      }
    };

    const copyRawTableShareText = async () => {
      if (!rawTaskRows.value.length) {
        showNotice("目前沒有可複製的資料。", "error");
        return;
      }

      const content = rawTableShareText.value;

      try {
        if (navigator.clipboard?.writeText) {
          await navigator.clipboard.writeText(content);
        } else {
          const textarea = document.createElement("textarea");
          textarea.value = content;
          textarea.setAttribute("readonly", "readonly");
          textarea.style.position = "fixed";
          textarea.style.left = "-9999px";
          document.body.appendChild(textarea);
          textarea.select();
          document.execCommand("copy");
          textarea.remove();
        }
        showNotice("已複製原始填答表格文字，可直接貼上分享。", "success");
      } catch {
        showNotice("複製失敗，請稍後再試。", "error");
      }
    };

    const addTask = async () => {
      tasks.value.push({
        id: crypto.randomUUID(),
        name: "",
        placeholder: pickRandomPlaceholder(),
        scores: {
          goodAt: null,
          love: null,
          meaning: null,
          paid: null
        }
      });

      await nextTick();
      const taskElements = document.querySelectorAll(".task");
      const newTaskElement = taskElements[taskElements.length - 1];

      if (newTaskElement) {
        newTaskElement.scrollIntoView({ behavior: "smooth", block: "center" });
        const input = newTaskElement.querySelector('.textfield, input[type="text"]');
        if (input) {
          input.focus();
        }
      }
    };

    const removeTask = (id) => {
      tasks.value = tasks.value.filter((task) => task.id !== id);
    };

    const canGoToStep = (step) => {
      if (step === 2) {
        return hasMinimumTasks.value;
      }

      if (step === 3) {
        return hasMinimumTasks.value && hasCompleteScores.value;
      }

      if (step === 4) {
        return hasMinimumTasks.value && hasCompleteScores.value;
      }

      return true;
    };

    const goToStep = async (step) => {
      if (!canGoToStep(step)) {
        if (!hasMinimumTasks.value) {
          window.alert(`請先在步驟 1 填寫至少 ${minTasksRequired} 筆有名稱的任務。`);
          currentStep.value = 1;
          return;
        }

        if (step === 3 && !hasCompleteScores.value) {
          window.alert("請先完成每筆任務的四項評分（請填 1～5）。");
          currentStep.value = 2;
          return;
        }

        return;
      }

      if (currentStep.value === 3 && step !== 3) {
        destroyCharts();
      }

      currentStep.value = step;
      await nextTick();
      window.scrollTo({ top: 0, behavior: "smooth" });

      if (step === 3) {
        buildCharts();
        syncCharts(normalizedRadarData.value);
      }
    };

    watch(normalizedRadarData, (newData) => {
      syncCharts(newData);
    });

    return {
      currentStep,
      progressPercent,
      minTasksRequired,
      ratingOptions,
      tasks,
      rawTaskRows,
      normalizedTotals,
      balance,
      stepThreePanel,
      notice,
      addTask,
      removeTask,
      goToStep,
      shareStepThreeScreenshot,
      copyRawTableShareText
    };
  }
}).mount("#app");
