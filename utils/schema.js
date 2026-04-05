import { index, pgTable, serial, text, varchar } from "drizzle-orm/pg-core";

export const MockInterview=pgTable('MockInterview',{
    id:serial('id').primaryKey(),
    jsonMockResp:text('jsonMockResp').notNull(),
    jobPosition:varchar('jobPosition', { length: 160 }).notNull(),
    jobDesc:varchar('jobDesc', { length: 4000 }).notNull(),
    jobExperience:varchar('jobExperience', { length: 32 }).notNull(),
    createdBy:varchar('createdBy', { length: 255 }).notNull(),
    createdAt:varchar('createdAt', { length: 32 }),
    mockId:varchar('mockId', { length: 64 }).notNull()
}, (table) => ({
    createdByIdx: index('mock_interview_created_by_idx').on(table.createdBy),
    mockIdIdx: index('mock_interview_mock_id_idx').on(table.mockId),
}))

export const UserAnswer = pgTable('userAnswer',{
    id:serial('id').primaryKey(),
    mockIdRef:varchar('mockId', { length: 64 }).notNull(),
    question:varchar('question', { length: 2000 }).notNull(),
    correctAns:text('correctAns'),
    userAns:text('userAns'),
    feedback:text('feedback'),
    rating:varchar('rating', { length: 16 }),
    userEmail:varchar('userEmail', { length: 255 }),
    createdAt:varchar('createdAt', { length: 32 })
}, (table) => ({
    mockIdRefIdx: index('user_answer_mock_id_idx').on(table.mockIdRef),
    userEmailIdx: index('user_answer_email_idx').on(table.userEmail),
}))
