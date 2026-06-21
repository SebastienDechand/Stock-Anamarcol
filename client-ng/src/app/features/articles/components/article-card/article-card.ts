import { Component, EventEmitter, Input, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { LucideAngularModule } from 'lucide-angular';
import { TranslatePipe } from '@ngx-translate/core';
import { Item } from '../../../../shared/models/item.model';

@Component({
  selector: 'app-article-card',
  standalone: true,
  imports: [CommonModule, LucideAngularModule, TranslatePipe],
  templateUrl: './article-card.html',
  styleUrl: './article-card.scss',
})
export class ArticleCard {
  @Input({ required: true }) item!: Item;
  @Input() canDecrement = false;
  @Input() isAdmin = false;

  @Output() cardClick = new EventEmitter<Item>();
  @Output() delete = new EventEmitter<Item>();
  @Output() increment = new EventEmitter<Item>();
  @Output() decrement = new EventEmitter<Item>();
  @Output() uploadPicture = new EventEmitter<{ item: Item; file: File }>();

  get imageUrl(): string {
    const img = this.item.image;
    if (!img) return '';
    if (img.startsWith('http') || img.startsWith('/')) return img;
    return `/${img}`;
  }

  get stockLabel(): string {
    const quantite = this.item.quantite;
    if (quantite <= 2) return 'Urgent';
    if (quantite < 5) return 'Limite';
    return 'OK';
  }

  get stockMod(): string {
    const quantite = this.item.quantite;
    if (quantite <= 2) return 'urgent';
    if (quantite < 5) return 'limite';
    return 'ok';
  }

  onFileChange(event: Event) {
    const file = (event.target as HTMLInputElement).files?.[0];
    if (file) this.uploadPicture.emit({ item: this.item, file });
  }
}
