import React from 'react';
import styles from './card.module.css';

const Card = ({ title, number, detailText }) => {
  console.log('Card number:', number);

  return (
    <div className={styles.container}>
      <div className={styles.texts}>
        <span className={styles.title}>{title}</span>
        <pre className={styles.number}>{number}</pre>
        <span className={styles.detail}>{detailText}</span>
      </div>
    </div>
  );
};

export default Card;
