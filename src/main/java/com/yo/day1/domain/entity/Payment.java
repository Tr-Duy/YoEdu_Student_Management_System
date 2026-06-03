package com.yo.day1.domain.entity;

import com.yo.day1.domain.AuditableEntity;
import com.yo.day1.domain.enums.PaymentMethod;
import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Getter
@Setter
@Entity
@Table(name = "payments")
public class Payment extends AuditableEntity {



        @ManyToOne(fetch = FetchType.LAZY)
        @JoinColumn(name = "invoice_id", nullable = false)
        private TuitionInvoice invoice;

        @Column(name = "payment_code", nullable = false, unique = true, length = 30)
        private String paymentCode;

        @Column(name = "paid_amount", nullable = false, precision = 12, scale = 2)
        private BigDecimal paidAmount;

        @Enumerated(EnumType.STRING)
        @Column(name = "payment_method", nullable = false, length = 20)
        private PaymentMethod paymentMethod;

        @Column(name = "paid_at", nullable = false)
        private LocalDateTime paidAt;

        @ManyToOne(fetch = FetchType.LAZY)
        @JoinColumn(name = "cashier_user_id")
        private Users cashierUser;

        @Column(length = 255)
        private String note;

}
