
import java.nio.file.Files;
import java.nio.file.Paths;
import java.nio.charset.StandardCharsets;
import java.io.Console;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;

public class VerifyAdminPassword {
    public static void main(String[] args) throws Exception {
        Console console = System.console();

        if (console == null) {
            System.out.println("Please run from CMD.");
            return;
        }

        char[] password = console.readPassword("Enter your new Admin password: ");

        String hash = new String(
            Files.readAllBytes(Paths.get("admin-password.hash")),
            StandardCharsets.UTF_8
        ).trim();

        boolean matches = new BCryptPasswordEncoder(12)
            .matches(new String(password), hash);

        System.out.println(matches
            ? "PASSWORD MATCHES SAVED HASH"
            : "PASSWORD DOES NOT MATCH SAVED HASH");

        java.util.Arrays.fill(password, ' ');
    }
}
