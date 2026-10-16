package com.kohort.ems.security;

import com.kohort.ems.model.Department;
import com.kohort.ems.model.Employee;
import com.kohort.ems.model.EmploymentStatus;
import com.kohort.ems.model.User;
import com.kohort.ems.repository.DepartmentRepository;
import com.kohort.ems.repository.EmployeeRepository;
import com.kohort.ems.repository.UserRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.boot.CommandLineRunner;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;

@Component
public class DataInitializer implements CommandLineRunner {

    private static final Logger log = LoggerFactory.getLogger(DataInitializer.class);

    private final UserRepository userRepository;
    private final DepartmentRepository departmentRepository;
    private final EmployeeRepository employeeRepository;
    private final PasswordEncoder passwordEncoder;

    public DataInitializer(UserRepository userRepository,
                           DepartmentRepository departmentRepository,
                           EmployeeRepository employeeRepository,
                           PasswordEncoder passwordEncoder) {
        this.userRepository = userRepository;
        this.departmentRepository = departmentRepository;
        this.employeeRepository = employeeRepository;
        this.passwordEncoder = passwordEncoder;
    }

    @Override
    public void run(String... args) {
        seedAdminUser();
        seedDepartments();
        seedSampleEmployees();
        normalizeLegacyPhoneNumbers();
    }

    private void normalizeLegacyPhoneNumbers() {
        try {
            List<Employee> all = employeeRepository.findAll();
            boolean changed = false;
            long seq = 1001;
            for (Employee emp : all) {
                String p = emp.getPhoneNumber();
                if (p != null && (p.contains("555") || p.startsWith("+1"))) {
                    emp.setPhoneNumber("+91 98" + String.format("%08d", seq++));
                    changed = true;
                }
            }
            if (changed) {
                employeeRepository.saveAll(all);
                log.info("Normalized legacy seed phone numbers to valid Indian format (+91 98xxxxxxxx).");
            }
        } catch (Exception e) {
            log.warn("Could not normalize legacy phone numbers: {}", e.getMessage());
        }
    }

    private void seedAdminUser() {
        if (!userRepository.existsByUsername("admin")) {
            User admin = User.builder()
                    .username("admin")
                    .password(passwordEncoder.encode("admin123"))
                    .role("ROLE_ADMIN")
                    .build();
            userRepository.save(admin);
            log.info("Default administrator seeded: username='admin', password='admin123'");
        }
    }

    private void seedDepartments() {
        if (departmentRepository.count() == 0) {
            List<Department> departments = List.of(
                    Department.builder().name("Engineering").description("Software development, QA, and DevOps").build(),
                    Department.builder().name("Human Resources").description("Talent acquisition, employee care, and payroll").build(),
                    Department.builder().name("Product & Design").description("Product strategy, roadmap, and UI/UX architecture").build(),
                    Department.builder().name("Marketing & Sales").description("Brand marketing, client growth, and revenue operations").build(),
                    Department.builder().name("Finance & Legal").description("Accounting, treasury, and regulatory compliance").build()
            );
            departmentRepository.saveAll(departments);
            log.info("Default departments initialized successfully.");
        }
    }

    private void seedSampleEmployees() {
        if (employeeRepository.count() == 0) {
            Department eng = departmentRepository.findByNameIgnoreCase("Engineering").orElse(null);
            Department hr = departmentRepository.findByNameIgnoreCase("Human Resources").orElse(null);
            Department prod = departmentRepository.findByNameIgnoreCase("Product & Design").orElse(null);

            if (eng != null && hr != null && prod != null) {
                List<Employee> initialEmployees = List.of(
                        Employee.builder()
                                .employeeId("EMP-1001")
                                .fullName("AKASH")
                                .email("amanthesillent@gmail.com")
                                .phoneNumber("+91 9079672366")
                                .department(eng)
                                .designation("Computer Application")
                                .dateOfJoining(LocalDate.of(2022, 3, 15))
                                .salary(new BigDecimal("135000.00"))
                                .status(EmploymentStatus.Active)
                                .build(),
                        Employee.builder()
                                .employeeId("EMP-1002")
                                .fullName("Tarun")
                                .email("tarun@gmail.com")
                                .phoneNumber("+91 9834567892")
                                .department(prod)
                                .designation("Principal Product Designer")
                                .dateOfJoining(LocalDate.of(2022, 6, 1))
                                .salary(new BigDecimal("118000.00"))
                                .status(EmploymentStatus.Active)
                                .build(),
                        Employee.builder()
                                .employeeId("EMP-1003")
                                .fullName("Tushar")
                                .email("tushar@gmail.com")
                                .phoneNumber("+91 9845678903")
                                .department(eng)
                                .designation("Senior Backend Engineer")
                                .dateOfJoining(LocalDate.of(2023, 1, 10))
                                .salary(new BigDecimal("105000.00"))
                                .status(EmploymentStatus.Active)
                                .build(),
                        Employee.builder()
                                .employeeId("EMP-1005")
                                .fullName("Lalan")
                                .email("lalan@gmail.com")
                                .phoneNumber("+91 9867890125")
                                .department(eng)
                                .designation("DevOps Engineer")
                                .dateOfJoining(LocalDate.of(2023, 8, 14))
                                .salary(new BigDecimal("98000.00"))
                                .status(EmploymentStatus.Inactive)
                                .build()
                );
                employeeRepository.saveAll(initialEmployees);
                log.info("Initial employees seeded into database with valid Indian phone numbers.");
            }
        }
    }
}
