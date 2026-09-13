package com.yo.day1.service;

import com.yo.day1.domain.enums.GradeClassification;
import com.yo.day1.service.impl.LearningResultServiceImpl;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

import java.math.BigDecimal;

import static org.junit.jupiter.api.Assertions.*;

public class LearningResultScoringTest {

    @Test
    @DisplayName("Test rounding: < 0.5 rounds down, >= 0.5 rounds up")
    void testRoundingRules() {
        // 9.4 -> 9, 9.5 -> 10
        // (9.0 + 9.8) / 2 = 9.4 -> 9
        assertEquals(9, LearningResultServiceImpl.calculateTotalScore(null, new BigDecimal("9.0"), new BigDecimal("9.8")));
        // (9.0 + 10.0) / 2 = 9.5 -> 10
        assertEquals(10, LearningResultServiceImpl.calculateTotalScore(null, new BigDecimal("9.0"), new BigDecimal("10.0")));

        // 8.4 -> 8, 8.5 -> 9
        // (8.0 + 8.8) / 2 = 8.4 -> 8
        assertEquals(8, LearningResultServiceImpl.calculateTotalScore(null, new BigDecimal("8.0"), new BigDecimal("8.8")));
        // (8.0 + 9.0) / 2 = 8.5 -> 9
        assertEquals(9, LearningResultServiceImpl.calculateTotalScore(null, new BigDecimal("8.0"), new BigDecimal("9.0")));

        // 7.4 -> 7, 7.5 -> 8
        // (7.0 + 7.8) / 2 = 7.4 -> 7
        assertEquals(7, LearningResultServiceImpl.calculateTotalScore(null, new BigDecimal("7.0"), new BigDecimal("7.8")));
        // (7.0 + 8.0) / 2 = 7.5 -> 8
        assertEquals(8, LearningResultServiceImpl.calculateTotalScore(null, new BigDecimal("7.0"), new BigDecimal("8.0")));

        // 6.4 -> 6, 6.5 -> 7
        // (6.0 + 6.8) / 2 = 6.4 -> 6
        assertEquals(6, LearningResultServiceImpl.calculateTotalScore(null, new BigDecimal("6.0"), new BigDecimal("6.8")));
        // (6.0 + 7.0) / 2 = 6.5 -> 7
        assertEquals(7, LearningResultServiceImpl.calculateTotalScore(null, new BigDecimal("6.0"), new BigDecimal("7.0")));

        // 5.4 -> 5, 5.5 -> 6
        // (5.0 + 5.8) / 2 = 5.4 -> 5
        assertEquals(5, LearningResultServiceImpl.calculateTotalScore(null, new BigDecimal("5.0"), new BigDecimal("5.8")));
        // (5.0 + 6.0) / 2 = 5.5 -> 6
        assertEquals(6, LearningResultServiceImpl.calculateTotalScore(null, new BigDecimal("5.0"), new BigDecimal("6.0")));
    }

    @Test
    @DisplayName("Test 2-component score calculation")
    void testTwoComponentScore() {
        // Student A: midterm = 8, final = 9 -> 8.5 -> 9 (Giỏi)
        Integer totalA = LearningResultServiceImpl.calculateTotalScore(null, new BigDecimal("8.0"), new BigDecimal("9.0"));
        assertEquals(9, totalA);
        assertEquals(GradeClassification.GIOI, LearningResultServiceImpl.calculateClassification(totalA));

        // Student C: midterm = 6, final = 7 -> 6.5 -> 7 (Khá)
        Integer totalC = LearningResultServiceImpl.calculateTotalScore(null, new BigDecimal("6.0"), new BigDecimal("7.0"));
        assertEquals(7, totalC);
        assertEquals(GradeClassification.KHA, LearningResultServiceImpl.calculateClassification(totalC));

        // Student D: midterm = 4, final = 5 -> 4.5 -> 5 (Yếu)
        Integer totalD = LearningResultServiceImpl.calculateTotalScore(null, new BigDecimal("4.0"), new BigDecimal("5.0"));
        assertEquals(5, totalD);
        assertEquals(GradeClassification.YEU, LearningResultServiceImpl.calculateClassification(totalD));
    }

    @Test
    @DisplayName("Test 3-component score calculation")
    void testThreeComponentScore() {
        // Student B: process = 8, midterm = 7, final = 9 -> 0.8 + 2.1 + 5.4 = 8.3 -> 8 (Giỏi)
        Integer totalB = LearningResultServiceImpl.calculateTotalScore(new BigDecimal("8.0"), new BigDecimal("7.0"), new BigDecimal("9.0"));
        assertEquals(8, totalB);
        assertEquals(GradeClassification.GIOI, LearningResultServiceImpl.calculateClassification(totalB));

        // Student E: process = 5, midterm = 5, final = 6 -> 0.5 + 1.5 + 3.6 = 5.6 -> 6 (Trung bình)
        Integer totalE = LearningResultServiceImpl.calculateTotalScore(new BigDecimal("5.0"), new BigDecimal("5.0"), new BigDecimal("6.0"));
        assertEquals(6, totalE);
        assertEquals(GradeClassification.TRUNG_BINH, LearningResultServiceImpl.calculateClassification(totalE));
    }

    @Test
    @DisplayName("Test incomplete score conditions (NULL handling)")
    void testIncompleteScoreConditions() {
        // process = 7, midterm = null, final = 9 -> null
        assertNull(LearningResultServiceImpl.calculateTotalScore(new BigDecimal("7.0"), null, new BigDecimal("9.0")));

        // process = 8, midterm = null, final = null -> null
        assertNull(LearningResultServiceImpl.calculateTotalScore(new BigDecimal("8.0"), null, null));

        // All null -> null
        assertNull(LearningResultServiceImpl.calculateTotalScore(null, null, null));

        // Only midterm without final -> null
        assertNull(LearningResultServiceImpl.calculateTotalScore(null, new BigDecimal("8.0"), null));

        // Classification of null is null
        assertNull(LearningResultServiceImpl.calculateClassification(null));
    }

    @Test
    @DisplayName("Test classification rules based on rounded total score")
    void testClassificationRules() {
        assertEquals(GradeClassification.YEU, LearningResultServiceImpl.calculateClassification(0));
        assertEquals(GradeClassification.YEU, LearningResultServiceImpl.calculateClassification(3));
        assertEquals(GradeClassification.YEU, LearningResultServiceImpl.calculateClassification(5));

        assertEquals(GradeClassification.TRUNG_BINH, LearningResultServiceImpl.calculateClassification(6));

        assertEquals(GradeClassification.KHA, LearningResultServiceImpl.calculateClassification(7));

        assertEquals(GradeClassification.GIOI, LearningResultServiceImpl.calculateClassification(8));
        assertEquals(GradeClassification.GIOI, LearningResultServiceImpl.calculateClassification(9));
        assertEquals(GradeClassification.GIOI, LearningResultServiceImpl.calculateClassification(10));
    }
}
