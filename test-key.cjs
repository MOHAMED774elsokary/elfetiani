const admin = require('firebase-admin');

const key = `-----BEGIN PRIVATE KEY-----\nMIIEvAIBADANBgkqhkiG9w0BAQEFAASCBKYwggSiAgEAAoIBAQCWisKJpNjGFkt4\n/Hm8xDmFezLEEB3aG1NZqTV6uwCNLDC3diLI3skch0KHcP9WZGOmMrC1xoJRACep\nzevBC83d2lveTBF86ywrRLufKPbcU6Kg7FGHo96BuJqJkGe6J5/TbHNBEsSjeTPV\nolGKVLU05ni4pGgXypLXfV2AiildTW6sI1yzAVG/AcSmB9dTrKxZ/U7jRB02IyjB\nbzi5KDCIeR+nLl9nzNrTDg7azSoIw1L3Nz8lPwz5TyrUTE4rDmdz1J+RGPOh10ZF\nQObTR0e8ukrTOb3zNYpKLfquuUJcLH3JU1Sh8JkCHZsy1U1bma+gYadSR1AFzXQw\n9G84BAIhAgMBAAECggEAARoXKjItaYbGgDurNEiPP2TrVlV5Xcw10sSlrkYsjvv6\nsnnAL65Myc4LfJRlHr0O9dZDZkiOPI5MHAa0jJtROJK1edsz72aFHQnMjJx8cRir\ndTLW9m+VQdJnzte3y1GornUfOK6CMgxMMYqV1EsXhUwmEvuWF6LSlWv2yXRJcPls\nyl1FKPHjfHMH3tBAr6K+7GSUXtG0DkI6gOEUxmivrdliLRUSuQMU9Z/x3eXGRhcr\ngNmv8mOWvmbIRukX9CmYmzlyaB6fsd9yvhy+VdlQYG+ap3aO5Qz042fmFk/YgzmD\nPKvz+2kvawyhunyAMq4Fe3BkXkPpWRBe7hpDLSL3AQKBgQDHL3Sj3B6w4/5vuqID\nVq+F1PHsxnzeuaKL3wbvE1LUO9iJ+Tth3xqoALFYeApAWxeQxPZ97onJ4swcYuwp\nYJ4bQv0eUHytykMpDQGtlJpS1Xr/lHx5RKPg0qaFhJhWVqFXM7Zzr1oW7yJx57eT\n3goURWv3CL+EBCflO8ZY79pnwQKBgQDBe1xH/U4QUh7u/C/RVcSeL2QNYbEkUBoC\nu7duaKOd4DeHk/pupWryvT6tLOXSBmCHjMMH7VVVPMm3G/K/523/TnQhUG0N4GWD\nXFIbgsVLqsxrprByimdyWengc2L9Mc0qtfm99Fgd7sEzPIphldBy4pkc6exUuY2M\nCWxJhb8yYQKBgBkCn223xO7HIfqbf55VsyJl0568aY951awka/V3Aq59eToR3l/y\nqKExvRLzt63PAk1+PckgO5Lq9GAYF7k2VYPszGWTC6Sywe4UoQJPp3UBMzmGRn7f\nnIgtSxV2yb4FkKqnZqBuAyzgB/4vb0CU38Ud1mmlYo7MCspg0A34x/7BAoGABB2N\nnvJiYLJ+efLfSYKbhgnYBPjY/b6+buRzSGPtZwRH6hhZsVTPa45e8OwNj2QXVYrG\n8zo3IHMEj2KGzVIs4stWaQb+6talEiA6lt83Nx7Q7lFDW4xaGvKSqPWLW3tds9Tf\nFQ1HeouDjIVzJBQ9tNPhEd5f6oVv31Sr+vxfTsECgYB6cfBWtbYetx0yAt7zuGIS\n40dvPGnarn3mxLqBEJ7dcwJpD2dbP0FUFHOiuoLf2YWrYtxBrrFAQMIOvQm59cBN\ndYvdPly4Z2z9QwdDbddftjtCntr0QSBcVSkVBF4gMemSf25rOXfiKXxfLM5Muy1Q\nN6rYeYF5QQy/PUyWRwPUNA==\n-----END PRIVATE KEY-----\n`;

try {
  admin.initializeApp({
    credential: admin.credential.cert({
      projectId: 'coaching-cd245',
      clientEmail: 'firebase-adminsdk-fbsvc@coaching-cd245.iam.gserviceaccount.com', // I am guessing this is the email
      privateKey: key.replace(/\\n/g, '\n'),
    }),
  });
  console.log("Firebase Admin Initialized successfully.");
} catch (e) {
  console.error("Failed to initialize:", e);
}
