'use client';

import { useState } from 'react';
import { ChevronLeftIcon, ChevronRightIcon } from '@heroicons/react/24/outline';

export interface Testimonial {
  author: string;
  avatar: string;
  text: string;
  likes: number;
  videoTitle: string;
  videoId: string;
}

export function Testimonials({ testimonials }: { testimonials: Testimonial[] }) {
  const [index, setIndex] = useState(0);

  if (testimonials.length === 0) return null;

  const current = testimonials[index];

  const goPrev = () => setIndex((i) => (i === 0 ? testimonials.length - 1 : i - 1));
  const goNext = () => setIndex((i) => (i === testimonials.length - 1 ? 0 : i + 1));

  return (
    <div className="relative">
      <div className="rounded-2xl bg-surface border border-gray-200 shadow-sm p-8 sm:p-10">
        <blockquote className="text-lg sm:text-xl text-text-primary leading-relaxed mb-6">
          &ldquo;{current.text}&rdquo;
        </blockquote>
        <div className="flex items-center gap-3">
          {/* eslint-disable-next-line @next/next/no-img-element -- small avatar from yt3.ggpht.com, plain img keeps this section simple */}
          <img
            src={current.avatar}
            alt=""
            className="h-11 w-11 rounded-full object-cover flex-shrink-0"
            loading="lazy"
          />
          <div>
            <p className="font-semibold text-text-primary">{current.author}</p>
            <p className="text-xs text-text-secondary">
              Comentario en YouTube · {current.videoTitle}
            </p>
          </div>
        </div>
      </div>

      <div className="mt-6 flex items-center justify-center gap-6">
        <button
          type="button"
          onClick={goPrev}
          aria-label="Testimonio anterior"
          className="rounded-full p-2 text-text-secondary hover:text-accent hover:bg-background-light transition-colors"
        >
          <ChevronLeftIcon className="h-6 w-6" aria-hidden="true" />
        </button>

        <div className="flex items-center gap-2">
          {testimonials.map((t, i) => (
            <button
              key={t.videoId + t.author}
              type="button"
              onClick={() => setIndex(i)}
              aria-label={`Ir al testimonio ${i + 1}`}
              className={`h-2 w-2 rounded-full transition-colors ${
                i === index ? 'bg-accent' : 'bg-gray-300'
              }`}
            />
          ))}
        </div>

        <button
          type="button"
          onClick={goNext}
          aria-label="Siguiente testimonio"
          className="rounded-full p-2 text-text-secondary hover:text-accent hover:bg-background-light transition-colors"
        >
          <ChevronRightIcon className="h-6 w-6" aria-hidden="true" />
        </button>
      </div>
    </div>
  );
}
