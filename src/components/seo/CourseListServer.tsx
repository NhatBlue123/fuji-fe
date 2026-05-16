import Image from "next/image";
import type { PublicCourseDto } from "./types";
import CourseCardActions from "@/components/user-component/course/CourseCardActions";
import {
  CourseInstructorLine,
  CourseLessonCount,
  CourseListHeading,
  CoursePriceBadge,
  CourseStudentCount,
} from "@/components/user-component/course/CoursePageI18nText";

interface CourseListServerProps {
  courses: PublicCourseDto[];
}

const DEFAULT_THUMBNAIL =
  "https://images.unsplash.com/photo-1493976040374-85c8e12f0c0e?q=80&w=800&auto=format&fit=crop";

/**
 * Server Component — renders the initial course grid for SSR.
 *
 * This component renders course cards with all indexable content (title,
 * description, price, rating, instructor) visible in the initial HTML
 * without JavaScript execution.
 *
 * The interactive CourseList client component renders below this and takes
 * over for filtering, pagination, and purchase actions.
 *
 * Must NOT use RTK Query, useState, useEffect, or any client-side hooks.
 */
export function CourseListServer({ courses }: CourseListServerProps) {
  return (
    <section
      aria-label="Course list"
      className="max-w-7xl mx-auto px-6 md:px-12 lg:px-20 py-8"
    >
      <h2 className="text-2xl font-bold text-foreground mb-6 flex items-center gap-2">
        <CourseListHeading />
      </h2>

      {courses.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <span className="material-symbols-outlined text-6xl text-muted-foreground/40 mb-4">
            search_off
          </span>
          <p className="text-lg font-medium text-muted-foreground">
            Không tìm thấy khóa học nào
          </p>
          <p className="text-sm text-muted-foreground mt-1">
            Hãy thử chọn danh mục hoặc từ khóa khác
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {courses.map((course) => {
            const slug = course.slug
              ? `/course/${course.slug}-${course.id}`
              : `/course/${course.id}`;
            const thumbnail = course.thumbnailUrl || DEFAULT_THUMBNAIL;
            const imageAlt = course.thumbnailAlt || course.title;

            return (
              <article
                key={course.id}
                className="bg-card rounded-2xl overflow-hidden border border-border card-hover-effect group flex flex-col h-full hover:shadow-xl transition-all duration-300"
              >
                {/* Thumbnail */}
                <div className="h-48 relative overflow-hidden">
                  <Image
                    src={thumbnail}
                    alt={imageAlt}
                    fill
                    className="object-cover transition-transform duration-700 group-hover:scale-110"
                    sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-background/80 via-transparent to-transparent opacity-80" />

                  {/* Price badge */}
                  <div className="absolute top-3 left-3 bg-secondary/90 backdrop-blur text-secondary-foreground text-xs font-bold px-3 py-1.5 rounded-lg border border-white/10 shadow-lg">
                    <CoursePriceBadge price={course.price} />
                  </div>

                  {/* Rating badge */}
                  {course.ratingCount > 0 && (
                    <div className="absolute top-3 right-3 bg-white/90 dark:bg-black/60 backdrop-blur px-2 py-1 rounded-lg flex items-center gap-1 text-yellow-600 dark:text-yellow-400 text-xs font-bold border border-black/10 dark:border-white/10 shadow-sm">
                      <span className="material-symbols-outlined text-sm filled">
                        star
                      </span>
                      {Number(course.averageRating).toFixed(1)}
                    </div>
                  )}
                </div>

                {/* Content */}
                <div className="p-5 flex flex-col flex-1">
                  {/* JLPT Level */}
                  {course.jlptLevel && (
                    <span className="text-xs font-bold text-secondary bg-secondary/10 px-2 py-0.5 rounded-full border border-secondary/20 self-start mb-2">
                      JLPT {course.jlptLevel}
                    </span>
                  )}

                  <h3 className="text-lg font-bold text-foreground mb-2 group-hover:text-secondary transition-colors line-clamp-1">
                    {course.title}
                  </h3>
                  {course.description && (
                    <p className="text-sm text-muted-foreground mb-4 line-clamp-2 leading-relaxed">
                      {course.description}
                    </p>
                  )}

                  {/* Instructor */}
                  {course.instructorName && (
                    <p className="text-xs text-muted-foreground mb-3">
                      <CourseInstructorLine name={course.instructorName} />
                    </p>
                  )}

                  {/* Stats */}
                  <div className="mt-auto pt-3 border-t border-border flex items-center gap-4 text-xs text-muted-foreground mb-4">
                    {course.lessonCount > 0 && (
                      <span className="flex items-center gap-1">
                        <span className="material-symbols-outlined text-sm">menu_book</span>
                        <CourseLessonCount count={course.lessonCount} />
                      </span>
                    )}
                    {course.studentCount > 0 && (
                      <span className="flex items-center gap-1">
                        <span className="material-symbols-outlined text-sm">group</span>
                        <CourseStudentCount count={course.studentCount} />
                      </span>
                    )}
                  </div>

                  {/* Auth-aware CTA */}
                  <CourseCardActions
                    courseId={course.id}
                    detailHref={slug}
                    price={course.price}
                  />
                </div>
              </article>
            );
          })}
        </div>
      )}
    </section>
  );
}
