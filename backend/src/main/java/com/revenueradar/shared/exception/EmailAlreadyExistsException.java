package com.revenueradar.shared.exception;

/**
 * Registration attempted with an email that already has an account.
 */
public class EmailAlreadyExistsException extends AppException {

    public EmailAlreadyExistsException() {
        super(ErrorCode.EMAIL_ALREADY_EXISTS, "An account with this email already exists");
    }
}
