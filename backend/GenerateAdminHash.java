import java.util.Scanner;
import java.nio.file.Files;
import java.nio.file.Paths;
import java.nio.charset.StandardCharsets;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;

public class GenerateAdminHash {
    public static void main(String[] args) throws Exception {
        Scanner scanner = new Scanner(System.in);
        System.out.print("Enter a NEW strong Admin password: ");
        String password = scanner.nextLine();

        BCryptPasswordEncoder encoder = new BCryptPasswordEncoder();
        String hash = encoder.encode(password);

        Files.write(Paths.get("admin-password.hash"),
            hash.getBytes(StandardCharsets.UTF_8));

        System.out.println("New hash saved locally.");
    }
}
