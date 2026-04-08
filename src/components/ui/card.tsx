import React from 'react';
import styles from './card.module.css';

type CardProps = {
  children: React.ReactNode;
  className?: string;
  title?: string;
  description?: string;
};

export function Card({ children, className, title, description }: CardProps) {
  return (
    <div className={`${styles.card} ${className || ''}`}>
      {(title || description) && (
        <div className={styles.header}>
          {title && <h3 className={styles.title}>{title}</h3>}
          {description && <p className={styles.description}>{description}</p>}
        </div>
      )}
      <div className={styles.content}>{children}</div>
    </div>
  );
}
