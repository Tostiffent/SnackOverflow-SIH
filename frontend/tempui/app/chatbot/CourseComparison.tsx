import React, { useState } from "react";
import coursesData from "./data/data.json"; // Adjust the path as necessary
import Modal from "./Modal"; // Import your Modal component

interface Course {
  name: string;
  scope: string;
  career_paths: string[];
  skills_required: string[];
  specializations: string[];
  average_salary: string;
  job_outlook: string;
  course_duration: string;
  core_subjects: string[];
}

interface CoursesData {
  courses: Course[];
}

interface CourseComparisonProps {
  onClose: () => void;
}

const CourseComparison: React.FC<CourseComparisonProps> = ({ onClose }) => {
  const [course1, setCourse1] = useState<string>("");
  const [course2, setCourse2] = useState<string>("");
  const [comparisonData, setComparisonData] = useState<{
    course1: Course;
    course2: Course;
  } | null>(null);
  const [isModalOpen, setModalOpen] = useState<boolean>(false);

  const handleCourse1Change = (event: React.ChangeEvent<HTMLSelectElement>) => {
    setCourse1(event.target.value);
  };

  const handleCourse2Change = (event: React.ChangeEvent<HTMLSelectElement>) => {
    setCourse2(event.target.value);
  };

  const handleCompare = () => {
    const selectedCourse1 = (coursesData as CoursesData).courses.find(
      (course) => course.name === course1
    );
    const selectedCourse2 = (coursesData as CoursesData).courses.find(
      (course) => course.name === course2
    );

    if (selectedCourse1 && selectedCourse2) {
      setComparisonData({ course1: selectedCourse1, course2: selectedCourse2 });
      setModalOpen(true);
    }
  };

  return (
    <div className="max-w-2xl mx-auto p-4">
      <h2 className="text-2xl font-bold mb-4">Compare Courses</h2>
      <div className="mb-4">
        <label className="block">Course 1:</label>
        <select
          value={course1}
          onChange={handleCourse1Change}
          className="w-full p-2 border rounded bg-white"
        >
          <option value="">Select a course</option>
          {(coursesData as CoursesData).courses.map((course) => (
            <option key={course.name} value={course.name}>
              {course.name}
            </option>
          ))}
        </select>
      </div>
      <div className="mb-4">
        <label className="block">Course 2:</label>
        <select
          value={course2}
          onChange={handleCourse2Change}
          className="w-full p-2 border rounded bg-white"
        >
          <option value="">Select a course</option>
          {(coursesData as CoursesData).courses.map((course) => (
            <option key={course.name} value={course.name}>
              {course.name}
            </option>
          ))}
        </select>
      </div>
      <button
  onClick={handleCompare}
  className="bg-gradient-to-r from-blue-600 to-green-600 text-white py-2 px-4 rounded-md font-bold hover:from-blue-700 hover:to-green-700 transition duration-200 transform hover:scale-105 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50 mr-4" // Added margin-right for spacing
>
  Compare
</button>
<button
  onClick={onClose}
  className="bg-gradient-to-r from-blue-600 to-green-600 text-white py-2 px-4 rounded-md font-bold hover:from-blue-700 hover:to-green-700 transition duration-200 transform hover:scale-105 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50"
>
  Close Sidebar
</button>


      {isModalOpen && comparisonData && (
        <Modal onClose={() => setModalOpen(false)}>
          <h3 className="text-xl font-bold mb-2 text-gray-800">
            Comparison Results:
          </h3>
          <div className="overflow-x-auto">
            <table className="min-w-full border border-gray-300 rounded-lg bg-white shadow-md">
              <thead className="bg-gray-200 text-gray-800">
                <tr>
                  <th className="border px-4 py-2">Parameter</th>
                  <th className="border px-4 py-2">
                    {comparisonData.course1.name}
                  </th>
                  <th className="border px-4 py-2">
                    {comparisonData.course2.name}
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {[
                  {
                    label: "Scope",
                    value1: comparisonData.course1.scope,
                    value2: comparisonData.course2.scope,
                  },
                  {
                    label: "Career Paths",
                    value1: comparisonData.course1.career_paths.join(", "),
                    value2: comparisonData.course2.career_paths.join(", "),
                  },
                  {
                    label: "Skills Required",
                    value1: comparisonData.course1.skills_required.join(", "),
                    value2: comparisonData.course2.skills_required.join(", "),
                  },
                  {
                    label: "Specializations",
                    value1: comparisonData.course1.specializations.join(", "),
                    value2: comparisonData.course2.specializations.join(", "),
                  },
                  {
                    label: "Average Salary",
                    value1: comparisonData.course1.average_salary,
                    value2: comparisonData.course2.average_salary,
                  },
                  {
                    label: "Job Outlook",
                    value1: comparisonData.course1.job_outlook,
                    value2: comparisonData.course2.job_outlook,
                  },
                  {
                    label: "Course Duration",
                    value1: comparisonData.course1.course_duration,
                    value2: comparisonData.course2.course_duration,
                  },
                  {
                    label: "Core Subjects",
                    value1: comparisonData.course1.core_subjects.join(", "),
                    value2: comparisonData.course2.core_subjects.join(", "),
                  },
                ].map((item) => (
                  <tr key={item.label}>
                    <td className="border px-4 py-2 font-semibold">
                      {item.label}
                    </td>
                    <td className="border px-4 py-2">{item.value1}</td>
                    <td className="border px-4 py-2">{item.value2}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <button
            onClick={() => setModalOpen(false)}
            className="mt-4 bg-gray-200 text-gray-700 px-4 py-2 rounded hover:bg-gray-300"
          >
            Close Table
          </button>
        </Modal>
      )}
    </div>
  );
};

export default CourseComparison;
