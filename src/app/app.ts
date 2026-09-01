import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

interface ScriptCard {
  id: number;
  text: string;
  skipped: boolean;
}

interface Plan {
  id: number;
  title: string;
  date: string;
  note: string;
}

interface Template {
  name: string;
  icon: string;
  cards: string[];
}

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './app.html',
  styleUrl: './app.css'
})
export class App implements OnInit {

  // =========================
  // 予定
  // =========================

  plans: Plan[] = [];

  selectedPlanId: number | null = null;

  // =========================
  // スクリプト
  //
  // titleごとに1つだけ存在する
  // 「買い物」なら、買い物の予定全部で共有
  // =========================

  scripts: Record<string, ScriptCard[]> = {};

  screen: 'calendar' | 'script' | 'card' = 'calendar';

  currentCardIndex = 0;

  currentYear = new Date().getFullYear();
  currentMonth = new Date().getMonth();

  selectedDate = this.formatDate(new Date());

  newPlanTitle = '';
  newPlanDate = this.formatDate(new Date());

  newCardText = '';

  editingCardId: number | null = null;
  editingCardText = '';

  touchStartX = 0;
  touchStartY = 0;
  cardOffsetX = 0;
  isDragging = false;

  theme: 'offwhite' | 'dark' | 'pop' = 'offwhite';

  showTemplates = false;

  templates: Template[] = [
    {
      name: '買い物',
      icon: '🛒',
      cards: [
        'お店へ行く',
        '必要なものを確認する',
        '商品を探す',
        'レジへ行く',
        '支払う',
        '荷物を確認する',
        '帰る'
      ]
    },
    {
      name: '病院',
      icon: '🏥',
      cards: [
        '家を出る',
        '病院へ行く',
        '受付する',
        '待つ',
        '診察を受ける',
        '会計する',
        '帰る'
      ]
    },
    {
      name: '外食',
      icon: '🍽️',
      cards: [
        'お店へ行く',
        'お店に入る',
        '席を探す',
        'メニューを見る',
        '注文する',
        '食べる',
        '支払う',
        '帰る'
      ]
    },
    {
      name: '電車',
      icon: '🚃',
      cards: [
        '駅へ行く',
        '切符・ICカードを確認する',
        '改札を通る',
        'ホームへ行く',
        '電車を待つ',
        '電車に乗る',
        '目的地で降りる',
        '改札を出る'
      ]
    },
    {
      name: 'バス',
      icon: '🚌',
      cards: [
        'バス停へ行く',
        'バスを待つ',
        'バスに乗る',
        '料金を確認する',
        '席につく',
        '目的地で降りる',
        '帰る'
      ]
    },
    {
      name: '旅行',
      icon: '✈️',
      cards: [
        '荷物を確認する',
        '家を出る',
        '駅・空港へ行く',
        '移動する',
        '目的地に到着する',
        'チェックインする',
        '予定を始める',
        '帰る'
      ]
    },
    {
      name: '家事',
      icon: '🧹',
      cards: [
        '必要なものを準備する',
        '始める場所を決める',
        '片付ける',
        '掃除する',
        'ゴミをまとめる',
        '終わった場所を確認する',
        '休む'
      ]
    },
    {
      name: 'ライブ',
      icon: '🎵',
      cards: [
        '持ち物を確認する',
        '会場へ向かう',
        '会場に到着する',
        '入場する',
        '場所を確認する',
        'ライブを見る',
        '退場する',
        '帰る'
      ]
    }
  ];


  // =========================
  // 初期化
  // =========================

  ngOnInit() {
    this.load();
  }


  // =========================
  // 保存
  // =========================

  save() {

    localStorage.setItem(
      'mekuru-plans',
      JSON.stringify(this.plans)
    );

    localStorage.setItem(
      'mekuru-scripts',
      JSON.stringify(this.scripts)
    );

    localStorage.setItem(
      'mekuru-theme',
      this.theme
    );
  }


  // =========================
  // 読み込み
  // =========================

  load() {

    const savedPlans =
      localStorage.getItem('mekuru-plans');

    const savedScripts =
      localStorage.getItem('mekuru-scripts');

    const savedTheme =
      localStorage.getItem('mekuru-theme');


    // -------------------------
    // 予定
    // -------------------------

    if (savedPlans) {

      try {

        const rawPlans = JSON.parse(savedPlans);

        this.plans = rawPlans.map((plan: any) => ({
          id: plan.id,
          title: plan.title,
          date: plan.date,
          note:
            typeof plan.note === 'string'
              ? plan.note
              : ''
        }));

      } catch {

        this.plans = [];

      }

    }


    // -------------------------
    // 新しいスクリプトデータ
    // -------------------------

    if (savedScripts) {

      try {

        this.scripts =
          JSON.parse(savedScripts);

      } catch {

        this.scripts = {};

      }

    }


    // -------------------------
    // 古いデータから移行
    //
    // 以前の Plan.cards に入っていた
    // カードをタイトルごとの scripts に移す
    // -------------------------

    if (savedPlans) {

      try {

        const rawPlans = JSON.parse(savedPlans);

        rawPlans.forEach((oldPlan: any) => {

          if (
            Array.isArray(oldPlan.cards) &&
            oldPlan.cards.length > 0
          ) {

            const title =
              String(oldPlan.title).trim();

            if (!title) return;


            // まだ共有スクリプトがなければ作る
            if (!this.scripts[title]) {

              this.scripts[title] =
                oldPlan.cards.map(
                  (card: any, index: number) => ({
                    id:
                      typeof card.id === 'number'
                        ? card.id
                        : Date.now() + index,

                    text:
                      typeof card.text === 'string'
                        ? card.text
                        : '',

                    skipped:
                      typeof card.skipped === 'boolean'
                        ? card.skipped
                        : false
                  })
                );

            }

          }

        });

      } catch {

        // 移行失敗時は何もしない

      }

    }


    // -------------------------
    // スクリプトの整形
    // -------------------------

    Object.keys(this.scripts).forEach(title => {

      if (!Array.isArray(this.scripts[title])) {
        this.scripts[title] = [];
      }

      this.scripts[title].forEach(card => {

        if (
          typeof card.skipped !== 'boolean'
        ) {
          card.skipped = false;
        }

      });

    });


    // -------------------------
    // テーマ
    // -------------------------

    if (
      savedTheme === 'offwhite' ||
      savedTheme === 'dark' ||
      savedTheme === 'pop'
    ) {

      this.theme = savedTheme;

    }


    // 移行したデータも保存
    this.save();
  }


  // =========================
  // 日付
  // =========================

  formatDate(date: Date): string {

    const year =
      date.getFullYear();

    const month =
      String(date.getMonth() + 1)
        .padStart(2, '0');

    const day =
      String(date.getDate())
        .padStart(2, '0');

    return `${year}-${month}-${day}`;
  }


  // =========================
  // カレンダー
  // =========================

  get monthTitle(): string {

    return `${this.currentYear}年 ${this.currentMonth + 1}月`;

  }


  get calendarDays(): (Date | null)[] {

    const firstDay =
      new Date(
        this.currentYear,
        this.currentMonth,
        1
      );

    const lastDay =
      new Date(
        this.currentYear,
        this.currentMonth + 1,
        0
      );

    const days: (Date | null)[] = [];


    for (
      let i = 0;
      i < firstDay.getDay();
      i++
    ) {

      days.push(null);

    }


    for (
      let day = 1;
      day <= lastDay.getDate();
      day++
    ) {

      days.push(
        new Date(
          this.currentYear,
          this.currentMonth,
          day
        )
      );

    }


    return days;
  }


  previousMonth() {

    this.currentMonth--;

    if (this.currentMonth < 0) {

      this.currentMonth = 11;
      this.currentYear--;

    }

  }


  nextMonth() {

    this.currentMonth++;

    if (this.currentMonth > 11) {

      this.currentMonth = 0;
      this.currentYear++;

    }

  }


  goToToday() {

    const today = new Date();

    this.currentYear =
      today.getFullYear();

    this.currentMonth =
      today.getMonth();

    this.selectedDate =
      this.formatDate(today);

    this.newPlanDate =
      this.selectedDate;
  }


  selectDate(date: Date) {

    this.selectedDate =
      this.formatDate(date);

    this.newPlanDate =
      this.selectedDate;
  }


  isSelectedDate(date: Date): boolean {

    return (
      this.formatDate(date) ===
      this.selectedDate
    );

  }


  isToday(date: Date): boolean {

    return (
      this.formatDate(date) ===
      this.formatDate(new Date())
    );

  }


  hasPlans(date: Date): boolean {

    const dateString =
      this.formatDate(date);

    return this.plans.some(
      plan => plan.date === dateString
    );

  }


  get selectedDatePlans(): Plan[] {

    return this.plans.filter(
      plan =>
        plan.date === this.selectedDate
    );

  }


  // =========================
  // 予定
  // =========================

  addPlan() {

    const title =
      this.newPlanTitle.trim();

    if (!title) return;


    const newPlan: Plan = {

      id: Date.now(),

      title,

      date: this.newPlanDate,

      note: ''

    };


    this.plans.push(newPlan);


    // 同じタイトルのスクリプトが
    // すでに存在するならそのまま共有。
    //
    // 存在しない場合だけ空のスクリプトを作る。

    if (!this.scripts[title]) {

      this.scripts[title] = [];

    }


    this.selectedDate =
      this.newPlanDate;


    const date =
      new Date(
        this.newPlanDate + 'T00:00:00'
      );


    this.currentYear =
      date.getFullYear();

    this.currentMonth =
      date.getMonth();


    this.newPlanTitle = '';

    this.save();
  }


  selectPlan(plan: Plan) {

    this.selectedPlanId =
      plan.id;

    this.currentCardIndex = 0;

    this.screen = 'script';

  }


  get selectedPlan(): Plan | null {

    return (
      this.plans.find(
        plan =>
          plan.id === this.selectedPlanId
      ) ?? null
    );

  }


  // =========================
  // 現在のスクリプト
  // =========================

  get selectedScript(): ScriptCard[] {

    const plan =
      this.selectedPlan;

    if (!plan) return [];

    return this.scripts[plan.title] ?? [];

  }


  deletePlan(plan: Plan) {

    const ok =
      confirm(
        `「${plan.title}」を削除しますか？`
      );

    if (!ok) return;


    this.plans =
      this.plans.filter(
        p => p.id !== plan.id
      );


    if (
      this.selectedPlanId === plan.id
    ) {

      this.selectedPlanId = null;

      this.screen = 'calendar';

    }


    this.save();
  }


  // =========================
  // テンプレート
  // =========================

  toggleTemplates() {

    this.showTemplates =
      !this.showTemplates;

  }


  useTemplate(template: Template) {

    const plan =
      this.selectedPlan;

    if (!plan) return;


    // タイトルごとの共有スクリプト
    this.scripts[plan.title] =
      template.cards.map(
        (text, index) => ({
          id: Date.now() + index,
          text,
          skipped: false
        })
      );


    this.currentCardIndex = 0;

    this.showTemplates = false;

    this.save();
  }


  // =========================
  // スクリプト
  // =========================

  addCard() {

    const plan =
      this.selectedPlan;

    const text =
      this.newCardText.trim();


    if (!plan || !text) return;


    if (!this.scripts[plan.title]) {

      this.scripts[plan.title] = [];

    }


    this.scripts[plan.title].push({

      id: Date.now(),

      text,

      skipped: false

    });


    this.newCardText = '';

    this.save();
  }


  deleteCard(index: number) {

    const plan =
      this.selectedPlan;

    if (!plan) return;


    const cards =
      this.scripts[plan.title];

    if (!cards) return;


    cards.splice(index, 1);


    if (
      this.currentCardIndex >=
      cards.length
    ) {

      this.currentCardIndex =
        Math.max(
          0,
          cards.length - 1
        );

    }


    this.save();
  }


  startEditCard(card: ScriptCard) {

    this.editingCardId =
      card.id;

    this.editingCardText =
      card.text;

  }


  saveCardEdit(card: ScriptCard) {

    const text =
      this.editingCardText.trim();

    if (!text) return;


    card.text = text;

    this.editingCardId = null;

    this.editingCardText = '';

    this.save();
  }


  cancelEdit() {

    this.editingCardId = null;

    this.editingCardText = '';

  }


  skipCard(card: ScriptCard) {

    card.skipped =
      !card.skipped;

    this.save();
  }


  moveCardUp(index: number) {

    const plan =
      this.selectedPlan;

    if (!plan || index <= 0) return;


    const cards =
      this.scripts[plan.title];

    if (!cards) return;


    [
      cards[index - 1],
      cards[index]
    ] = [
      cards[index],
      cards[index - 1]
    ];


    this.save();
  }


  moveCardDown(index: number) {

    const plan =
      this.selectedPlan;

    if (!plan) return;


    const cards =
      this.scripts[plan.title];

    if (
      !cards ||
      index >= cards.length - 1
    ) {

      return;

    }


    [
      cards[index],
      cards[index + 1]
    ] = [
      cards[index + 1],
      cards[index]
    ];


    this.save();
  }


  // =========================
  // カード
  // =========================

  startCards() {

    const cards =
      this.selectedScript;


    if (cards.length === 0) {

      return;

    }


    const firstAvailableIndex =
      cards.findIndex(
        card => !card.skipped
      );


    if (
      firstAvailableIndex === -1
    ) {

      return;

    }


    this.currentCardIndex =
      firstAvailableIndex;

    this.screen = 'card';
  }


  get activeCard(): ScriptCard | null {

    const cards =
      this.selectedScript;


    return (
      cards[
        this.currentCardIndex
      ] ?? null
    );

  }


  get currentCardNumber(): number {

    return this.currentCardIndex + 1;

  }


  get totalCardNumber(): number {

    return this.selectedScript.length;

  }


  get hasPreviousCard(): boolean {

    const cards =
      this.selectedScript;


    for (
      let i =
        this.currentCardIndex - 1;

      i >= 0;

      i--
    ) {

      if (!cards[i].skipped) {

        return true;

      }

    }


    return false;
  }


  get hasNextCard(): boolean {

    const cards =
      this.selectedScript;


    for (
      let i =
        this.currentCardIndex + 1;

      i < cards.length;

      i++
    ) {

      if (!cards[i].skipped) {

        return true;

      }

    }


    return false;
  }


  nextCard() {

    const cards =
      this.selectedScript;


    for (
      let i =
        this.currentCardIndex + 1;

      i < cards.length;

      i++
    ) {

      if (!cards[i].skipped) {

        this.currentCardIndex = i;

        return;

      }

    }

  }


  previousCard() {

    const cards =
      this.selectedScript;


    for (
      let i =
        this.currentCardIndex - 1;

      i >= 0;

      i--
    ) {

      if (!cards[i].skipped) {

        this.currentCardIndex = i;

        return;

      }

    }

  }


  skipCurrentCard() {

    const card =
      this.activeCard;

    if (!card) return;


    card.skipped = true;

    this.nextCard();

    this.save();
  }


  // =========================
  // スワイプ
  // =========================

  onTouchStart(event: TouchEvent) {

    this.touchStartX =
      event.changedTouches[0].screenX;

    this.touchStartY =
      event.changedTouches[0].screenY;

    this.cardOffsetX = 0;

    this.isDragging = true;
  }


  onTouchMove(event: TouchEvent) {

    if (!this.isDragging) return;


    const currentX =
      event.changedTouches[0].screenX;

    const currentY =
      event.changedTouches[0].screenY;


    const diffX =
      currentX - this.touchStartX;

    const diffY =
      currentY - this.touchStartY;


    if (
      Math.abs(diffX) >
      Math.abs(diffY)
    ) {

      event.preventDefault();

      this.cardOffsetX =
        diffX;

    }

  }


  onTouchEnd(event: TouchEvent) {

    if (!this.isDragging) return;


    const endX =
      event.changedTouches[0].screenX;


    const distance =
      endX - this.touchStartX;


    this.isDragging = false;


    const threshold = 80;


    if (
      Math.abs(distance) >=
      threshold
    ) {

      if (distance < 0) {

        this.nextCard();

      } else {

        this.previousCard();

      }

    }


    this.cardOffsetX = 0;
  }


  // =========================
  // 画面移動
  // =========================

  backToCalendar() {

    this.selectedPlanId = null;

    this.screen = 'calendar';

    this.showTemplates = false;

  }


  backToScript() {

    this.screen = 'script';

    this.showTemplates = false;

  }


  // =========================
  // メモ
  // =========================

  updateNote(value: string) {

    const plan =
      this.selectedPlan;

    if (!plan) return;


    // メモはPlan自身に保存されるので
    // 同じタイトルでも共有されない

    plan.note = value;

    this.save();
  }


  // =========================
  // テーマ
  // =========================

  setTheme(
    theme:
      'offwhite' |
      'dark' |
      'pop'
  ) {

    this.theme = theme;

    this.save();
  }

}