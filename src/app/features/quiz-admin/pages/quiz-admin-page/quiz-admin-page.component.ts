import { Component, OnInit } from '@angular/core';
import {
  FormArray,
  FormBuilder,
  FormControl,
  FormGroup,
  Validators,
} from '@angular/forms';
import { ToastController } from '@ionic/angular';
import { Observable } from 'rxjs';

import { apiErrorMessage } from '../../../../core/http/api-error';
import {
  QuestionType,
  Quiz,
  QuizOption,
  QuizQuestion,
} from '../../../../core/models';
import { QuizService } from '../../../../core/services/quiz.service';

@Component({
  selector: 'app-quiz-admin-page',
  templateUrl: './quiz-admin-page.component.html',
  styleUrls: ['./quiz-admin-page.component.scss'],
  standalone: false,
})
export class QuizAdminPageComponent implements OnInit {
  readonly QuestionType = QuestionType;
  quizzes$!: Observable<Quiz[]>;
  editingId: string | null = null;
  saving = false;

  readonly form = this.fb.group({
    title: ['', [Validators.required, Validators.minLength(2)]],
    passMarkPercent: [
      70,
      [Validators.required, Validators.min(0), Validators.max(100)],
    ],
    questions: this.fb.array<FormGroup>([]),
  });

  constructor(
    private readonly fb: FormBuilder,
    private readonly quizService: QuizService,
    private readonly toast: ToastController,
  ) {}

  private async notify(message: string): Promise<void> {
    const t = await this.toast.create({ message, duration: 3000, position: 'bottom' });
    await t.present();
  }

  ngOnInit(): void {
    this.quizzes$ = this.quizService.quizzes$;
    this.addQuestion(QuestionType.MultipleChoice);
  }

  get questions(): FormArray<FormGroup> {
    return this.form.get('questions') as FormArray<FormGroup>;
  }

  options(question: FormGroup): FormArray<FormGroup> {
    return question.get('options') as FormArray<FormGroup>;
  }

  addQuestion(type: QuestionType = QuestionType.MultipleChoice): void {
    const group = this.fb.group({
      type: this.fb.control(type, Validators.required),
      prompt: ['', Validators.required],
      options: this.fb.array<FormGroup>([]),
      correctOptionId: ['', Validators.required],
    });
    this.questions.push(group);
    this.applyTypeDefaults(group, type);
  }

  removeQuestion(index: number): void {
    this.questions.removeAt(index);
  }

  onTypeChange(question: FormGroup, type: QuestionType): void {
    this.applyTypeDefaults(question, type);
  }

  private applyTypeDefaults(question: FormGroup, type: QuestionType): void {
    const options = this.options(question);
    options.clear();
    if (type === QuestionType.TrueFalse) {
      options.push(this.optionGroup('true', 'True'));
      options.push(this.optionGroup('false', 'False'));
      question.get('correctOptionId')!.setValue('true');
    } else {
      options.push(this.optionGroup(this.optionId(), ''));
      options.push(this.optionGroup(this.optionId(), ''));
      question.get('correctOptionId')!.setValue('');
    }
  }

  addOption(question: FormGroup): void {
    if (question.get('type')!.value === QuestionType.TrueFalse) {
      return;
    }
    this.options(question).push(this.optionGroup(this.optionId(), ''));
  }

  removeOption(question: FormGroup, index: number): void {
    const options = this.options(question);
    if (options.length <= 2) {
      return;
    }
    const removedId = options.at(index).get('id')!.value;
    options.removeAt(index);
    if (question.get('correctOptionId')!.value === removedId) {
      question.get('correctOptionId')!.setValue('');
    }
  }

  private optionGroup(id: string, label: string): FormGroup {
    return this.fb.group({
      id: this.fb.control(id, Validators.required),
      label: this.fb.control(label, Validators.required),
    });
  }

  private optionId(): string {
    return `o-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
  }

  edit(quiz: Quiz): void {
    this.editingId = quiz.id;
    this.questions.clear();
    this.form.patchValue({
      title: quiz.title,
      passMarkPercent: quiz.passMarkPercent,
    });
    for (const q of quiz.questions) {
      const group = this.fb.group({
        type: this.fb.control(q.type, Validators.required),
        prompt: [q.prompt, Validators.required],
        options: this.fb.array<FormGroup>([]),
        correctOptionId: [q.correctOptionId ?? '', Validators.required],
      });
      const optionsArray = group.get('options') as FormArray<FormGroup>;
      for (const opt of q.options) {
        optionsArray.push(this.optionGroup(opt.id, opt.label));
      }
      this.questions.push(group);
    }
  }

  cancel(): void {
    this.editingId = null;
    this.questions.clear();
    this.form.reset({ passMarkPercent: 70 });
    this.addQuestion(QuestionType.MultipleChoice);
  }

  save(): void {
    if (this.saving) {
      return;
    }
    if (this.form.invalid || this.questions.length === 0) {
      this.form.markAllAsTouched();
      void this.notify(
        'Please complete the quiz (title, pass mark, and at least one valid question).',
      );
      return;
    }
    const value = this.form.getRawValue();
    const questions: QuizQuestion[] = this.questions.controls.map((c, i) => {
      const raw = c.getRawValue() as {
        type: QuestionType;
        prompt: string;
        options: QuizOption[];
        correctOptionId: string;
      };
      return {
        id: `q${i + 1}`,
        type: raw.type,
        prompt: raw.prompt,
        options: raw.options,
        correctOptionId: raw.correctOptionId,
      };
    });

    const invalidCorrect = questions.some(
      (q) => !q.options.some((o) => o.id === q.correctOptionId),
    );
    if (invalidCorrect) {
      void this.notify(
        'Each question needs a correct answer selected from its options.',
      );
      return;
    }

    const fields = {
      title: value.title!,
      passMarkPercent: Number(value.passMarkPercent),
      questions,
    };
    const editingId = this.editingId;
    const request$ = editingId
      ? this.quizService.update({ id: editingId, ...fields })
      : this.quizService.create(fields);

    this.saving = true;
    request$.subscribe({
      next: () => {
        this.saving = false;
        void this.notify(editingId ? 'Quiz updated' : 'Quiz created');
        this.cancel();
      },
      error: (err: unknown) => {
        // Keep the builder as it is so the admin does not lose their work.
        this.saving = false;
        void this.notify(apiErrorMessage(err));
      },
    });
  }

  remove(quiz: Quiz): void {
    this.quizService.remove(quiz.id).subscribe({
      next: () => {
        void this.notify('Quiz removed');
        if (this.editingId === quiz.id) {
          this.cancel();
        }
      },
      error: (err: unknown) => void this.notify(apiErrorMessage(err)),
    });
  }

  isTrueFalse(question: FormGroup): boolean {
    return question.get('type')!.value === QuestionType.TrueFalse;
  }
}
